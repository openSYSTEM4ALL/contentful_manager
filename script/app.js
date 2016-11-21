$(document).ready(function () {
  $('#splashscreen').fadeOut(1000);
  $(".button-collapse").sideNav();
  $('.parallax').parallax();
  $('ul li a').click(function () {
    $('li').removeClass("active");
    $(this).parent().addClass("active");
  });

});