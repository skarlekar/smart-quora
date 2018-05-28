function randomInRange(from, to) {
  var r = Math.random();
  return Math.round(Math.floor(r * (to - from) + from));
}

function generateId(header) {
  return header + "-" + randomInRange(1000, 9999999);
}

function getAccessToken() {
  var access_token = getCookie('access_token');
  if (!access_token) {
    console.log("No access_token cookie found - Redirecting to authenticate.");
    authenticationRedirect(access_token, pingurl, loginurl);
    return;
  }
  var matches = access_token.match(/^s:(.+?)\./);
  if (!matches) {
    console.log("access_token cookie was found, but it was broken! Redirecting to authenticate.");
    authenticationRedirect(access_token, pingurl, loginurl);
    return;
  }
  access_token = matches[1];
  console.log("Access Token :" + access_token);
  return access_token;
}

async function getData(url, accessToken) {
  var config = {
    "headers": {
      "X-Access-Token": accessToken
    }
  }
  let data = await (await fetch(url, config)).json();
  return data;
}

async function postData(url, json, accessToken) {
  let config = {
    "method": "POST",
    "headers": {
      "X-Access-Token": accessToken
    },
    "body": JSON.stringify(json)
  };
  let data = await (await fetch(url, config));
  return data;
}

function postToUrl200(url, body, accessToken) {
  var statusCode;
  let config = {
    "method": "POST",
    "headers": {
      "X-Access-Token": accessToken,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    "body": JSON.stringify(body)
  };
  //let data = await (await fetch(url, config));
  fetch(url, config)
    .then(response => {
      // we received the response, now print the status code
      console.log("@@@@@@@@@@@@@@@@@@@@@@ postToUrl Response Status: " + response.status);
      statusCode = response.status;
      if (response.status == 200) {
        showSuccessAlert("Transaction posted successfully!");
      }
      // return response body as JSON
      return response.json();
    })
    .then(json => {
      // print the JSON
      console.log("postToUrl Response : " + JSON.stringify(json, null, 2));
      if (statusCode == 500) {
        var errorStr = json["error"]["message"];
        var n = errorStr.lastIndexOf("Error:");
        var message = errorStr.substr(n);
        showErrorAlert(message);
      }

    })
    .catch(function(reason) {
      console.log("postToUrl Failure: " + reason.message);
    });
}



async function postToUrl204(url, accessToken, successMessage) {
  let config = {
    "method": "POST",
    "headers": {
      "X-Access-Token": accessToken,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  };
  let response = await fetch(url, config);
  console.log("postToUrl Response Status: " + response.status)
  if (response.status == 204) {
    showSuccessAlert(successMessage);
    return 204;
  } else {
    showInfoAlert("Error posting. Check you console");
    let data = await response.json();
    console.log("postToUrl Response : " + JSON.stringify(data, null, 2));
    return data;
  }
}

async function postFormData(url, accessToken) {
  let body = {
    "type": "formData"
  };
  let config = {
    "method": "POST",
    "headers": {
      "X-Access-Token": accessToken,
      "Content-Type": "multipart/form-data",
      "Accept": "application/json"
    },
    "body": JSON.stringify(body)
  };
  let data = await (await fetch(url, config));
  return data;
}

function authenticationRedirect(accessToken, pingurl, loginurl) {
  var statusCode;
  var config = {
    "headers": {
      "X-Access-Token": accessToken
    }
  }
  console.log("config: " + JSON.stringify(config, null, 2));
  fetch(pingurl, config)
    .then(function(response) {
      console.log("Auth Check Response Status: " + response.status);
      statusCode = response.status;
      if (response.status == '401')
        window.location.href = loginurl;
      return response.json();
    })
    .then(json => {
        // print the JSON
        console.log("&&&&&&&&&&&&&&&&&&&&& postToUrl Response : " + JSON.stringify(json, null, 2));
        if (statusCode == 500) {
          var errorStr = json["error"]["message"];
          showErrorAlert(errorStr);
          if (errorStr == "A business network card has not been specified") {
            window.location.href = "upload-card.html";
          }
        }
      });
    }

  async function getTokenValue(pingurl, quorauserurl) {
    accessToken = getAccessToken();
    var currentUserData = await getData(pingurl, accessToken);
    var currentUserId = currentUserData["participant"].substr(currentUserData["participant"].indexOf("#") + 1);
    var quoraUserData = await getData(quorauserurl + "/" + currentUserId, accessToken);
    var tokenValue = quoraUserData["token"];
    return tokenValue;
  }

  function paintWallet(walleturl, accessToken) {
    var selectRef = document.getElementById("available-cards");
    console.log("Fetching wallet data");
    getData(walleturl, accessToken)
      .then(function(data) {
        console.log("Wallet: " + JSON.stringify(data, null, 2));
        var currentCard;
        var currentCardName = "None";
        for (var i = 0; i < data.length; i++) {
          card = data[i];
          var opt = document.createElement('option');
          opt.value = card["name"];
          opt.innerHTML = card["name"];
          if (card["default"]) {
            currentCard = card;
            currentCardName = card["name"];
            opt.selectedIndex = i;
          }
          selectRef.appendChild(opt);
        }
        document.getElementById("current-card").value = currentCardName;
      })
      .then(function(){
         getTokenValue(pingurl, quorauserurl)
        .then(function(tokenValue) {
          document.getElementById("token-value").value = tokenValue;
        })
      })
      .catch(function(reason) {
        console.log("Wallet Fetch Failure: " + reason.message)
      });
  }

  function uploadCard() {
    var cardName = document.getElementById("new-card-name").value;
    var cardFile = document.getElementById("card-file").value;
    if (cardName.length == 0) {
      alert("Error: Provide a card name");
    } else if (cardFile.length == 0) {
      alert("Error: Provide a valid card file");
    } else {
      var formElement = document.querySelector("upload-new-card");
      var request = new XMLHttpRequest();
      request.withCredentials = true;
      request.addEventListener("readystatechange", function() {
        if (this.readyState === 4) {
          console.log("******** XMLHttpRequest Status: " + this.responseText);
        }
      });
      request.open("POST", walletimporturl, false);
      var accessToken = getAccessToken();
      request.setRequestHeader("X-Access-Token", accessToken);
      request.setRequestHeader("Accept", "application/json");
      request.setRequestHeader("Cache-Control", "no-cache");
      request.send(new FormData(formElement));
      console.log("Upload Status: " + request.status);
    }
  }

  function uploadCard1() {
    var cardName = document.getElementById("new-card-name").value;
    var cardFile = document.getElementById("card-file").value;
    if (cardName.length == 0) {
      alert("Error: Provide a card name");
    } else if (cardFile.length == 0) {
      alert("Error: Provide a valid card file");
    } else {
      var formData = new FormData();
      formData.append("name", cardName);
      formData.append("card", cardFile);
      console.log("cardName: " + cardName);
      console.log("cardFile: " + cardFile);
      //formData.append("card", document.getElementById("card-file").files[0]);
      var request = new XMLHttpRequest();
      request.withCredentials = true;
      request.addEventListener("readystatechange", function() {
        if (this.readyState === 4) {
          console.log("******** XMLHttpRequest Status: " + this.responseText);
        }
      });
      var accessToken = getAccessToken();
      console.log("walletimporturl: " + walletimporturl);
      request.open("POST", walletimporturl, false);
      request.setRequestHeader("X-Access-Token", accessToken);
      //request.setRequestHeader("Content-Type", "multipart/form-data");
      request.setRequestHeader("Accept", "application/json");
      request.setRequestHeader("Cache-Control", "no-cache");
      request.send(formData);
      console.log("Upload Status: " + request.status);
    }
  }

  function changeCard() {
    var dropdown = document.getElementById("available-cards");
    var selected = dropdown.options[dropdown.selectedIndex].value;
    var accessToken = getAccessToken();
    var setDefaultUrl = walleturl + "/" + selected + "/" + "setDefault";
    var message = "Digital Identity was changed to card: " + selected;
    postToUrl204(setDefaultUrl, accessToken, message)
    .then(function() {
      document.getElementById("token-value").value = "";
      document.getElementById("current-card").value = selected;
      getTokenValue(pingurl, quorauserurl)
      .then(function(tokenValue){
        document.getElementById("token-value").value = tokenValue;
      });
    });
  }
