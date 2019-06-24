module.exports=function () {
    $('li').click(function () {
        alert('u click at index:' + $(this).index())
    })
}
