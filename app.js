const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require("./config.json");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var sql = require("mysql");
var error;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set("view engine", "ejs");

var sqlConnection = sql.createConnection({
    host: "localhost",
    user: "root",
    port: "3306",
    password: "1234",
    database: "coursereview",
    multipleStatements: true
});
sqlConnection.connect(function(err) {
    if (!err) {
        console.log("Connected to SQL");
    } else {
        console.log("Connection Failed" + err);
    }
});

app.get("/", async function(req, res) {

    await sqlConnection.query("update course,(select avg(Rating) as avg_rat,feedback.Course_id as id from feedback group by(feedback.Course_id)) as table1 set course.avg_rating=table1.avg_rat where course.course_id=table1.id;", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log("Tables Update!");
            res.redirect("/login");
        }
    })


});

app.get("/login", function(req, res) {
    var errmain = error;
    error = "";
    res.render("login.ejs", { errmain: errmain });
});

app.post("/login/faculty", async function(req, res) {
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    await sqlConnection.query(`select * from faculty where F_ID='${username}'`, function(err, rows) {
        if (err) {
            console.log(err);
            error = "Something Went Wrong";
            res.redirect("/login");
        } else {
            if (rows.length == 0) {
                console.log(rows);
                error = "No users Found";
                res.redirect("/login");
            } else {
                if (bcrypt.compareSync(password, rows[0].password)) {
                    res.render("inter", {
                        token: jwt.sign({ role: "faculty", username }, config.hasher),
                        role: "faculty",
                        user: username
                    })
                } else {
                    error = "Password Incorrect";
                    res.redirect("/login");


                }
            }
        }
    })

});

app.post("/login/admin", async function(req, res) {
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    await sqlConnection.query(`select * from admin where username='${username}'`, function(err, rows) {
        if (err) {
            console.log(err);
            error = "Something Went Wrong";
            res.redirect("/login");
        } else {
            if (rows.length == 0) {
                console.log(rows);
                error = "No users Found";
                res.redirect("/login");
            } else {
                if (password === rows[0].password) {
                    res.render("inter", {
                        token: jwt.sign({ role: "admin", username }, config.hasher),
                        role: "admin",
                        user: username
                    });
                } else {
                    error = "Password Incorrect";
                    res.redirect("/login");

                }
            }
        }
    })

});

app.post("/login/student", async function(req, res) {

    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    await sqlConnection.query(`select * from student where Roll_no='${username}'`, function(err, rows) {
        if (err) {
            console.log(err);
            error = "Something Went Wrong";
            res.redirect("/login");
        } else {
            if (rows.length == 0) {
                console.log(rows);
                error = "No users Found";
                res.redirect("/login");
            } else {
                if (bcrypt.compareSync(password, rows[0].Password)) {
                    res.render("inter", {
                        token: jwt.sign({ role: "student", username }, config.hasher),
                        role: "student",
                        user: username
                    })
                } else {
                    error = "Password Incorrect";
                    res.redirect("/login");

                }
            }
        }
    })
})

app.get("/faculty/register", function(req, res) {
    var errmain = error;
    error = "";
    res.render("facregister.ejs", { errmain: errmain });
});

app.post("/faculty/register", async function(req, res) {
    console.log(req.body);
    var F_ID = req.body.Username;
    var Password = req.body.Password;
    var Fname = req.body.Fname;
    var Lastname = req.body.Lname;
    var email = req.body.Email_id;
    var DOB = req.body.dob;

    var hashPassword = await bcrypt.hash(Password, config.salt);
    console.log(hashPassword);
    sqlConnection.query("Insert into faculty set ?", { F_ID: F_ID, Fname: Fname, Gender: req.body.Gender, Lastname: Lastname, Password: hashPassword, DOB: DOB, email: email }, async function(err, results) {
        if (err) {
            console.log(err);
            error = "Please Check Your Username!" + err.sqlMessage;
            res.redirect("/faculty/register");
        } else {
            await sqlConnection.query("Insert into facultycontactinfo set ?", { F_ID: F_ID, FContact_no: parseInt(req.body.phno) }, function(err1, results1) {
                if (err1) {
                    console.log(err);
                    error = "Please Check Your Phno";
                    res.redirect("/faculty/register");
                } else {
                    res.redirect("/login");
                }
            })

        }

    });
});

app.get("/student/register", function(req, res) {
    var errmain = error;
    error = "";
    res.render("sturegister.ejs", { errmain: errmain });
});

app.post("/student/register", async function(req, res) {
    console.log(req.body);
    var Roll_no = req.body.Username;
    var Password = req.body.Password;
    var Fname = req.body.Fname;
    var Lastname = req.body.Lname;
    var email = req.body.Email_id;
    var DOB = req.body.dob;

    var hashPassword = await bcrypt.hash(Password, config.salt);
    console.log(hashPassword);

    sqlConnection.query("Insert into student set ?", { Roll_no: Roll_no, Fname: Fname, Lname: Lastname, Gender: req.body.Gender, DOB: DOB, Password: hashPassword, Email_id: email }, function(err, results) {
        if (err) {
            console.log(err);
            error = "Please Check Your Username!" + err.sqlMessage;
            res.redirect("/student/register");
        } else {
            if (Roll_no.includes('cb.') && Roll_no.length === 16) {
                res.redirect("/login");
            } else {
                error = "Invalid Username";
                res.redirect("/student/register");

            }

        }

    });
})

app.get("/admin/home", async function(req, res) {
    var errmain = error;
    error = "";
    await sqlConnection.query("Select * from course", async function(err, results) {
        if (err) {
            console.log(err);
        } else {
            await sqlConnection.query("Select * from faculty", async function(err1, results1) {
                if (err1) {
                    console.log(err1);
                } else {
                    res.render("adminhome.ejs", { course: results, faculty: results1, errmain: errmain });
                }
            })

        }
    })

});
app.get("/admin/home/stats", async function(req, res) {

    await sqlConnection.query('Select count(*) as students from student', async function(err, results) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            await sqlConnection.query(`Select count(*) as faculties from faculty`, async function(err1, results1) {
                if (err1) {
                    console.log(err1);
                    res.redirect("back");
                } else {
                    await sqlConnection.query(`Select count(*) as courses from course`, async function(err2, results2) {
                        if (err2) {
                            console.log(err2);
                            res.redirect("back");
                        } else {
                            await sqlConnection.query(`Select count(*) as feedbacks from feedback`, async function(err3, results3) {
                                if (err3) {
                                    console.log(err3);
                                    res.redirect("back");
                                } else {
                                    await sqlConnection.query(`Select count(*) as query from queries`, async function(err4, results4) {
                                        if (err4) {
                                            console.log(err4);
                                            res.redirect("back");
                                        } else {
                                            await sqlConnection.query(`Select count(QueryID) as answered from queries where Status='Answered'`, async function(err5, results5) {
                                                if (err5) {
                                                    console.log(err5);
                                                    res.redirect("back");
                                                } else {
                                                    await sqlConnection.query(`Select avg_rating,course_id from course`, async function(err6, results6) {
                                                        if (err6) {
                                                            console.log(err6);
                                                            res.redirect("back");
                                                        } else {
                                                            await sqlConnection.query(`select Course_Id,count(QueryID) as cnt from queries group by Course_Id;`, async function(err7, results7) {
                                                                if (err7) {
                                                                    console.log(err7);
                                                                    res.redirect("back");
                                                                } else {
                                                                    await sqlConnection.query(`select Course_Id,count(Roll_no) as cnt from feedback group by Course_Id;`, async function(err8, results8) {
                                                                        if (err8) {
                                                                            console.log(err8);
                                                                            res.redirect("back");
                                                                        } else {
                                                                            res.render("stats.ejs", { students: results[0], faculties: results1[0], courses: results2[0], feedbacks: results3[0], query: results4[0], answered: results5[0], courserating: results6, quer: results7, feeds: results8 });

                                                                        }
                                                                    })

                                                                }
                                                            });

                                                        }
                                                    })

                                                }
                                            })
                                        }

                                    });
                                }

                            });
                        }
                    });
                }

            });
        }
    });
});
app.get("/admin/home/faculty", async function(req, res) {
    var errmain = error;
    error = "";

    await sqlConnection.query("Select * from faculty", async function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render("adminfachome.ejs", { faculty: results, errmain: errmain });
        }
    })

});

app.get("/admin/home/student", async function(req, res) {
    var errmain = error;
    error = "";

    await sqlConnection.query("Select * from student", async function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render("adminstuhome.ejs", { student: results, errmain: errmain });
        }
    })

});
app.post("/add/course", async function(req, res) {

    var id = req.body.Course_id.toUpperCase();
    console.log(id);
    var name = req.body.Course_name;
    var preRequisite = req.body.prereq;
    var type = req.body.type;
    var description = req.body.Desc;
    var avg_marks = parseFloat(req.body.avg_marks);
    var avg_rating = parseFloat(req.body.avg_rating);
    if (preRequisite === "") {
        preRequisite = "NULL";
    }
    if (avg_rating === "") {
        console.log("Empty field  Detected");
        avg_rating = 0;
    } else {
        avg_rating = parseFloat(req.body.avg_rating);
    }
    console.log(req.body);
    console.log(preRequisite);
    console.log(avg_rating);

    if (id.length === 8) {
        console.log("true");
        await sqlConnection.query("INSERT into course set ?", { course_id: id, name: name, description: description, preRequisite: preRequisite, avg_rating: avg_rating, avg_marks: avg_marks, Type: type }, function(err, results) {
            if (err) {
                console.log(err);
                res.redirect("/admin/home");
                error = "Somethimg Went wrong while Inserting.... Try Again!!";
            } else {
                error = "Success adding Course" + id + "!!";
                res.redirect("/admin/home");
            }
        })
    } else {
        console.log(id.length === 8);
        console.log(name.substring(2, 4) === "CSE");
        console.log(name.substring(2, 4) === "MAT");
        console.log(name.includes("ECE"));
        console.log(name.includes("SSK"));
        console.log(name.includes("PSY"));
        console.log(name.includes("PHY"));
        console.log(avg_rating > 0);
        console.log(avg_rating <= 5);
        res.redirect("/admin/home");
        error = "Please enter Valid Course Details";
    }

});

app.post("/add/faculty", async function(req, res) {

    var F_ID = req.body.F_ID;
    var Fname = req.body.Fname;
    var Lastname = req.body.Lastname;
    var Gender = req.body.Gender;
    var Password = req.body.password;
    var DOB = req.body.DOB;
    var email = req.body.email;
    var hashPassword = await bcrypt.hash(Password, config.salt);
    console.log(hashPassword);

    sqlConnection.query("Insert into faculty set ?", { F_ID: F_ID, Fname: Fname, Lastname: Lastname, Gender: Gender, password: hashPassword, DOB: DOB, email: email }, function(err, results) {
        if (err) {
            console.log(err);
            error = "Please Check FacultyID " + err.sqlMessage;
            res.redirect("/admin/home/faculty");
        } else {
            error = "Success adding Faculty" + F_ID + "!!";
            res.redirect("/admin/home/faculty");
        }

    });

});

app.post("/add/student", async function(req, res) {

    var Roll_no = req.body.Roll_no;
    var Fname = req.body.Fname;
    var Lname = req.body.Lname;
    var Address = req.body.Address;
    var Gender = req.body.Gender;
    var DOB = req.body.DOB;
    var Password = req.body.Password;
    var Email_id = req.body.Email_id;
    var Mark = parseFloat(req.body.Mark);

    var hashPassword = await bcrypt.hash(Password, config.salt);
    console.log(hashPassword);
    if (Mark > 0 && Mark <= 10) {
        sqlConnection.query("Insert into student set ?", { Roll_no: Roll_no, Fname: Fname, Lname: Lname, Address: Address, Gender: Gender, DOB: DOB, Password: hashPassword, Email_id: Email_id, Mark: Mark }, function(err, results) {
            if (err) {
                console.log(err);
                error = "Please Check Student RollNo! " + err.sqlMessage;
                res.redirect("/admin/home/student");
            } else {
                error = "Success adding Student " + Roll_no + " !!";
                res.redirect("/admin/home/student");
            }

        });
    } else {
        error = "CGPA must be <=10";
        res.redirect("/admin/home/student");
    }


});

app.get("/edit/course/:id", async function(req, res) {

    await sqlConnection.query("Select * from course", async function(err1, results) {
        if (err1) {
            console.log(err);
            error = "Error While loading ... Try Again!!";
            res.redirect("/admin/home");
        } else {
            await sqlConnection.query(`Select * from course where course_id='${req.params.id}'`, function(err, results1) {
                if (err) {
                    console.log(err);
                    error = "Error While loading ... Try Again!!";
                    res.redirect("/admin/home");
                } else {
                    console.log(results1)
                    res.render("editCourse.ejs", { course: results, upcourse: results1[0] });
                }
            });
        }
    });
});

app.post("/edit/course/:id", async function(req, res) {
    var id = req.body.Course_id.toUpperCase();
    console.log(id);
    var name = req.body.Course_name;
    var preRequisite = req.body.prereq;
    var type = req.body.type;
    var description = req.body.Desc;
    var avg_marks = parseFloat(req.body.avg_marks);
    var avg_rating = parseFloat(req.body.avg_rating);
    if (preRequisite === "") {
        preRequisite = "NULL";
    }


    if (id.length === 8) {
        console.log("true");
        await sqlConnection.query(`Update course set ? Where course_id='${id}'`, { name: name, description: description, preRequisite: preRequisite, avg_rating: avg_rating, avg_marks: avg_marks, type: type }, function(err, results) {
            if (err) {
                error = "Somethimg Went wrong while Inserting.... Try Again!!";
                res.redirect("/admin/home");

            } else {
                error = "Success Editing Course" + id + "!!";
                res.redirect("/admin/home");
            }
        })
    } else {
        console.log(id.length === 8);
        console.log(name.substring(2, 4) === "CSE");
        console.log(name.substring(2, 4) === "MAT");
        console.log(name.includes("ECE"));
        console.log(name.includes("SSK"));
        console.log(name.includes("PSY"));
        console.log(name.includes("PHY"));
        console.log(avg_rating > 0);
        console.log(avg_rating <= 5);
        res.redirect("/admin/home");
        error = "Please enter Valid Course Details";
    }


});

app.get("/edit/faculty/:id", async function(req, res) {

    await sqlConnection.query("Select * from faculty", async function(err, results) {
        if (err) {
            console.log(err);
            error = "Something Went wrong while Loading.... Try Again!!";
            res.redirect("/admin/home/faculty");
        } else {
            sqlConnection.query(`Select * from faculty where F_ID='${req.params.id}'`, function(err1, results1) {
                if (err1) {
                    console.log(err1);
                    error = "Something Went wrong while Loading.... Try Again!!";
                    res.redirect("/admin/home/faculty");
                } else {
                    res.render("editFac.ejs", { upfaculty: results1[0], faculty: results })
                }
            })
        }

    });

});

app.post("/edit/faculty/:id", async function(req, res) {

    var Fname = req.body.Fname;
    var Lastname = req.body.Lastname;
    var Gender = req.body.Gender;
    var Password = req.body.password;
    var oldPassword = req.body.old_password;
    var DOB = req.body.DOB;
    var email = req.body.email;
    var hashPassword = await bcrypt.hash(Password, config.salt);
    console.log(hashPassword);

    await sqlConnection.query(`Select * from faculty where F_ID='${req.params.id}'`, function(err1, results1) {
        if (err1) {
            console.log(err1);
            error = "Please Check FacultyID " + err.sqlMessage;
            res.redirect("/admin/home/faculty");

        } else {

            sqlConnection.query(`Update faculty set ? where F_ID='${req.params.id}'`, { Fname: Fname, Lastname: Lastname, Gender: Gender, password: hashPassword, DOB: DOB, email: email }, function(err, results) {
                if (err) {
                    console.log(err);
                    error = "Please Check FacultyID " + err.sqlMessage;
                    res.redirect("/admin/home/faculty");
                } else {
                    error = "Success Editing Faculty" + req.params.id + "!!";
                    res.redirect("/admin/home/faculty");
                }

            });

        }
    });



});

app.get("/edit/student/:id", async function(req, res) {

    await sqlConnection.query("Select * from student", async function(err, results) {
        if (err) {
            console.log(err);
            error = "Something Went wrong while Loading.... Try Again!!";
            res.redirect("/admin/home/student");
        } else {
            sqlConnection.query(`Select * from student where Roll_no='${req.params.id}'`, function(err1, results1) {
                if (err1) {
                    console.log(err1);
                    error = "Something Went wrong while Loading.... Try Again!!";
                    res.redirect("/admin/home/student");
                } else {
                    res.render("editStu.ejs", { upstudent: results1[0], student: results })
                }
            })
        }

    });

});
app.post("/edit/student/:id", async function(req, res) {

    var Roll_no = req.body.Roll_no;
    var Fname = req.body.Fname;
    var Lname = req.body.Lname;
    var Address = req.body.Address;
    var Gender = req.body.Gender;
    var DOB = req.body.DOB;
    var old_Password = req.body.old_Password;
    var Password = req.body.Password;
    var Email_id = req.body.Email_id;
    var Mark = parseFloat(req.body.Mark);

    var hashPassword = await bcrypt.hash(Password, config.salt);
    console.log(hashPassword);
    if (Mark > 0 && Mark <= 10) {

        await sqlConnection.query(`Select * from student where Roll_no='${req.params.id}'`, function(err1, results1) {

            if (err1) {
                console.log(err1);
                error = "Please Check Student RollNo! " + err.sqlMessage;
                res.redirect("/admin/home/student");
            } else {

                sqlConnection.query(`Update student set ? where Roll_no='${req.params.id}'`, { Fname: Fname, Lname: Lname, Address: Address, Gender: Gender, DOB: DOB, Password: hashPassword, Email_id: Email_id, Mark: Mark }, function(err, results) {
                    if (err) {
                        console.log(err);
                        error = "Please Check Student RollNo! " + err.sqlMessage;
                        res.redirect("/admin/home/student");
                    } else {
                        error = "Success adding Student " + Roll_no + " !!";
                        res.redirect("/admin/home/student");

                    }

                });

            }

        });


    } else {
        error = "CGPA must be <=10";
        res.redirect("/admin/home/student");
    }


});
app.get("/delete/course/:id", async function(req, res) {
    console.log(req.body);
    var id = req.params.id;

    sqlConnection.query(`Delete from course where course_id='${id}'`, function(err, results) {
        if (err) {
            console.log(err);
            error = "Something Went wring While Deleting. Try Again!!";
            res.redirect("/admin/home");
        } else {
            console.log(results);
            error = "Success deleting " + id + " !!";
            res.redirect("/admin/home");

        }
    });


});

app.get("/delete/faculty/:id", async function(req, res) {
    console.log(req.body);
    var id = req.params.id;

    sqlConnection.query(`Delete from faculty where F_ID='${id}'`, function(err) {
        if (err) {
            console.log(err);
            error = "Something Went wring While Deleting. Try Again!!";
            res.redirect("/admin/home/faculty");

        } else {

            error = "Success deleting " + id + " !!";
            res.redirect("/admin/home/faculty");
        }
    })
});

app.get("/delete/student/:id", async function(req, res) {
    console.log(req.body);
    var id = req.params.id;

    sqlConnection.query(`Delete from student where Roll_no='${id}'`, function(err) {
        if (err) {
            console.log(err);
            error = "Something Went wring While Deleting. Try Again!!";
            res.redirect("/admin/home/student");

        } else {

            error = "Success deleting " + id + " !!";
            res.redirect("/admin/home/student");
        }
    });
});


app.get("/course/:id", async function(req, res) {
    console.log(req.params.id);
    var feedmsg = "Feedbacks";
    var querymsg = "Queries";

    await sqlConnection.query(`Select * from course where course_id='${req.params.id}'`, async function(err, results) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            await sqlConnection.query(`Select * from feedback,student where Course_id='${req.params.id}' and feedback.Roll_no=student.Roll_no`, async function(err1, results1) {
                if (err1) {
                    console.log(err1);
                    res.redirect("/login");
                } else {
                    await sqlConnection.query(`Select * from queries,student where Course_Id='${req.params.id}' and queries.Roll_No=student.Roll_no`, async function(err2, results2) {
                        if (err2) {
                            console.log(err1);
                            res.redirect("/login");
                        } else {
                            if (results1.length === 0) {
                                feedmsg = "No feedbacks for this Course Yet!"

                            }
                            if (results2.length === 0) {
                                querymsg = "No Queries for this Course Yet!"
                            }

                            console.log(results1);
                            console.log(results2);
                            res.render("coursehome.ejs", { course: results[0], feedmsg: feedmsg, feedbacks: results1, querymsg: querymsg, quer: results2 });

                        }
                    });

                }
            });

        }
    })
})

app.get("/home/:id", async function(req, res) {
    await sqlConnection.query("select * from course", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render("home.ejs", { courses: results });
        }
    })

});
app.post("/home/filter/:id", async function(req, res) {
    console.log(req.body);
    var courses;
    if (req.body.filed1 != '') {
        await sqlConnection.query(`Select * from course where course_id like '%${req.body.field1.toUpperCase()}%' and Type='${req.body.type}'`, function(err, results) {
            if (err) {
                console.log(err);
                res.redirect("back");
            } else {
                console.log(results);
                courses = results;
                res.render("home.ejs", { courses: results });

            }
        });

    } else {
        await sqlConnection.query(`Select * from course where Type='${req.body.type}'`, function(err1, results1) {
            if (err1) {
                console.log(err1);
                res.redirect("back");
            } else {
                console.log(results1);
                courses = results1;
                res.render("home.ejs", { courses: results1 });

            }
        });

    }
    console.log(courses);


});
app.get("/home/student/:id", async function(req, res) {

    await sqlConnection.query("select * from course", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render("stuhome.ejs", { courses: results });
        }
    })

});
app.get("/home/student/profile/:id", async function(req, res) {

    await sqlConnection.query(`Select * from student where student.Roll_no='${req.params.id}'`, async function(err, results) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            await sqlConnection.query(`Select * from studentcontactinfo where studentcontactinfo.Roll_no='${req.params.id}'`, function(err1, results1) {
                if (err1) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    res.render("stuprofile.ejs", { student: results, contact: results1 });
                }
            });

        }
    })


});
app.post("/home/student/profile/:id", async function(req, res) {
    console.log(req.body);
    await sqlConnection.query(`Update student set ? where Roll_no='${req.params.id}'`, { Address: req.body.address, Mark: req.body.cgpa }, async function(err) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            await sqlConnection.query("Insert into studentcontactinfo set ?", { Roll_no: req.params.id, Contact_no: parseInt(req.body.phno) }, function(err1) {
                if (err1) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    res.redirect("/home/student/" + req.params.id);
                }
            })

        }
    })

});
app.post("/home/student/filter/:id", async function(req, res) {
    console.log(req.body);
    var courses;
    if (req.body.filed1 != '') {
        await sqlConnection.query(`Select * from course where course_id like '%${req.body.field1.toUpperCase()}%' and Type='${req.body.type}'`, function(err, results) {
            if (err) {
                console.log(err);
                res.redirect("back");
            } else {
                console.log(results);
                courses = results;
                res.render("stuhome.ejs", { courses: results });

            }
        });

    } else {
        await sqlConnection.query(`Select * from course where Type='${req.body.type}'`, function(err1, results1) {
            if (err1) {
                console.log(err1);
                res.redirect("back");
            } else {
                console.log(results1);
                courses = results1;
                res.render("stuhome.ejs", { courses: results1 });

            }
        });

    }
    console.log(courses);


});
app.get("/feedbacks/:id", async function(req, res) {
    await sqlConnection.query(`select * from feedback,student where Course_id='${req.params.id}' and feedback.Roll_no=student.Roll_no`, function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render("feedbacks.ejs", { feedbacks: results });
        }
    })

});

app.post("/feedbacks/:id", async function(req, res) {
    console.log(req.body);
    await sqlConnection.query(`Insert into feedback set ?`, { Roll_no: req.body.user, Course_id: req.params.id, Rating: req.body.rating, Review: req.body.feedback, Year: String(new Date().getFullYear()) }, async function(err, results) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            await sqlConnection.query(`Update course set course.avg_rating=(select avg(Rating) from feedback where feedback.Course_id='${req.params.id}') where course.course_id='${req.params.id}'`, function(err1, results1) {
                if (err1) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    console.log("Updated");
                    res.redirect("/feedbacks/" + req.params.id);
                }
            })


        }
    });
});
app.get("/queries/:id", async function(req, res) {

    await sqlConnection.query(`Select * from queries,student where Course_Id='${req.params.id}' and queries.Roll_No=student.Roll_no`, async function(err, results) {
        if (err) {
            console.log(err);
        } else {
            res.render("queries.ejs", { quer: results });
        }
    });

});

app.post("/query/update/:id", async function(req, res) {
    console.log(req.body);
    await sqlConnection.query(`Update queries set ? where QueryID='${req.params.id}'`, { Answer: req.body.answer, F_ID: req.body.user, Status: 'Answered' }, function(err, results) {
        if (err) {
            console.log(err);
            res.redirect("back");

        } else {
            res.redirect("back");
        }
    });
});
app.post("/queries/:id", async function(req, res) {
    console.log(req.body);
    await sqlConnection.query(`Insert into queries set ?`, { Roll_no: req.body.user, Course_id: req.params.id, Question: req.body.question, Status: "Pending" }, function(err, results) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect("/course/" + req.params.id);
        }
    });
});


app.listen(3000, function() {
    console.log("Server Running at 3000");
});