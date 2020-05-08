
// JavaScript
$(document).ready(function(){
    $('.carousel').carousel('pause');
    $('.menu-toggle').click(function(){
        $('.responsive-nav').toggleClass("unfold");
        $(this).toggleClass("close-menu");
    });

    $('#responsive-nav, .unfold.nav-links').click(function(){
        $('.responsive-nav').toggleClass("unfold");
        $('.menu-toggle').toggleClass("close-menu");
    });
});