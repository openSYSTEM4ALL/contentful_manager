$(document).ready(function () {
  $('#splashscreen').fadeOut(1000);
  $(".button-collapse").sideNav({
      menuWidth: 200, // Default is 240
      closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
    });
  $('.parallax').parallax();
  $('ul li a').click(function () {
    $('li').removeClass("active");
    $(this).parent().addClass("active");
  });

});