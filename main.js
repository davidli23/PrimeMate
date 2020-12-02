document.getElementById('button').addEventListener("click", start);

function start() {
  //window.close();
  let url = $("[name='ens url']").val();
  $.ajax({
    type: 'GET',
    url: url
  })
}
