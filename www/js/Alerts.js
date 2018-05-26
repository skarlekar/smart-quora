function showErrorAlert(message) {
  var newElement = "<div id='alert-window' class='fixed-top alert alert-danger hide'> \
                      <button class='close'  type='button' data-dismiss='alert' > \
                              <span>&times;</span> \
                          </button> \
                          <span id='alert-window-span'> \
                            Message goes here... \
                          </span> \
                    </div> \
  ";
  document.body.insertAdjacentHTML('afterbegin', newElement);
  document.getElementById("alert-window-span").innerHTML = message;
  document.getElementById("alert-window").className = "fixed-top alert alert-danger show";
}

function showSuccessAlert(message) {
  var newElement = "<div id='alert-window' class='fixed-top alert alert-success hide'> \
                      <button class='close'  type='button' data-dismiss='alert' > \
                              <span>&times;</span> \
                          </button> \
                          <span id='alert-window-span'> \
                            Message goes here... \
                          </span> \
                    </div> \
  ";
  document.body.insertAdjacentHTML('afterbegin', newElement);
  document.getElementById("alert-window-span").innerHTML = message;
  document.getElementById("alert-window").className = "fixed-top alert alert-success show";
}


function showInfoAlert(message) {
  var newElement = "<div id='alert-window' class='fixed-top alert alert-info hide'> \
                      <button class='close'  type='button' data-dismiss='alert' > \
                              <span>&times;</span> \
                          </button> \
                          <span id='alert-window-span'> \
                            Message goes here... \
                          </span> \
                    </div> \
  ";
  document.body.insertAdjacentHTML('afterbegin', newElement);
  document.getElementById("alert-window-span").innerHTML = message;
  document.getElementById("alert-window").className = "fixed-top alert alert-info show";
}

