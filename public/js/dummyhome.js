$(document).ready(function() {
    $(".add-row").click(function() {

        var name = $("#Course_name").val();
        var Course_id = $("#Course_id").val();
        var desc = $("#Desc").val();
        var prereq = $("#prereq").val();
        var typ = $("#type").val();
        var mark = $("#avg_marks").val();
        var rat = $("#avg_rating").val();
        if (rat != "") {
            rat = rat + "/5";
        }
        if (name != "" && Course_id != "" && desc != "" && typ != "" && mark != "") {
            var markup = "<tr><td><input type='checkbox' name='record'></td><td>" + Course_id + "</td><td>" + name + "</td></td>" + "</td><td>" + desc + "</td><td>" + prereq + "</td><td>" + typ + "</td><td>" + mark + "/100" + "</td><td>" + rat + "</td></tr>";
            $("table tbody").append(markup);
        } else {
            alert('Fields Cannot be Left Empty!!');
        }
    });

    // Find and remove selected table rows
    $(".delete-row").click(function() {
        $("table tbody").find('input[name="record"]').each(function() {
            if ($(this).is(":checked")) {
                $(this).parents("tr").remove();
            }
        });
    });
});