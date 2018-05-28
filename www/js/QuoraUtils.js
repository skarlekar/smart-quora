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
