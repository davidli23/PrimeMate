document.addEventListener("DOMContentLoaded", function() {
	var Button = document.getElementById('button');
	Button.addEventListener('click', onClick();
});

function onClick() {
	window.close();
	window.open("inputs.html", "_blank", "height=600,width=850,top=-100");
}
