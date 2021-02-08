import axios from "axios";
import eventBus from "./../EventBus";

const grantTypes = ["authorization_code", "client_credentials"];

const oauthData = {
    api_authorize_endpoint: "https://api.codechef.com/oauth/authorize",
    api_token_endpoint: "https://api.codechef.com/oauth/token",
    response_type: "code",
    state: "axbycz",
    redirect_uri: "http://localhost:3000/",
    CLIENT_ID: "",
    CLIENT_SECRET: "",
};

let sessionData = {
    authorized: false,
    grant_type: grantTypes[1],
    ACCESS_TOKEN: "",
    REFRESH_TOKEN: "",
};

const requestAccessToken = async (code) => {
    console.log(code);
    let headers = {
        "Content-Type": "application/json",
    };
    let data = {
        grant_type: "authorization_code",
        code: code,
        client_id: oauthData.CLIENT_ID,
        client_secret: oauthData.CLIENT_SECRET,
        redirect_uri: oauthData.redirect_uri,
    };
    let resp = await axios.post(oauthData.api_token_endpoint, data, {
        headers: headers,
    });
    if (resp.status == 200) {
        console.log(resp.data);
        sessionData.ACCESS_TOKEN = resp.data.result.data.access_token;
        sessionData.REFRESH_TOKEN = resp.data.result.data.refresh_token;
        return "success";
    }
};

const refreshToken = async () => {
    let headers = {
        "Content-Type": "application/json",
    };
    let data = {};
    if (sessionData.authorized) {
        data = {
            grant_type: "refresh_token",
            refresh_token: sessionData.REFRESH_TOKEN,
            client_id: oauthData.CLIENT_ID,
            client_secret: oauthData.CLIENT_SECRET,
        };
    } else {
        data = {
            grant_type: "client_credentials",
            scope: "public",
            client_id: oauthData.CLIENT_ID,
            client_secret: oauthData.CLIENT_SECRET,
            redirect_uri: oauthData.redirect_uri,
        };
    }
    let resp = await axios.post(oauthData.api_token_endpoint, data, {
        headers: headers,
    });
    if (resp.status == 200) {
        console.log(resp.data);
        sessionData.ACCESS_TOKEN = resp.data.result.data.access_token;
        if (sessionData.grant_type == "authorization_code")
            sessionData.REFRESH_TOKEN = resp.data.result.data.refresh_token;
        console.log(sessionData.ACCESS_TOKEN);
        window.localStorage.setItem("sessionData", JSON.stringify(sessionData));
        return "success";
    } else {
        return "failure";
    }
};

const getClientID = () => {
    return oauthData.CLIENT_ID;
};

const getAccessToken = () => {
    return sessionData.ACCESS_TOKEN;
};

const isAuthorized = () => {
    return sessionData.authorized;
};

const onMountCheckUserStatus = () => {
    const retriveItem = window.localStorage.getItem("sessionData");
    if (retriveItem == null) return false;
    else {
        const _sessionData = JSON.parse(retriveItem);
        sessionData = _sessionData;
        return true;
    }
};

const authorize = () => {
    window.location = `${oauthData.api_authorize_endpoint}?response_type=${oauthData.response_type}&client_id=${oauthData.CLIENT_ID}&state=${oauthData.state}&redirect_uri=${oauthData.redirect_uri}`;
};

const onMountCheckUrl = async () => {
    const queryString = window.location.search;
    const paramList = new URLSearchParams(queryString);
    if (paramList.has("code")) {
        let stat = await requestAccessToken(paramList.get("code"));
        if ((stat = "success")) {
            sessionData.authorized = true;
            sessionData.grant_type = grantTypes[0];
            window.localStorage.setItem(
                "sessionData",
                JSON.stringify(sessionData)
            );
            eventBus.dispatch("authorisedChanged", { message: true });
        }
    }
};

const unauthorize = async () => {
    sessionData.authorized = false;
    sessionData.grant_type = grantTypes[1];
    let stat = await refreshToken();
    if (stat == "success") {
        window.localStorage.setItem("sessionData", JSON.stringify(sessionData));
        eventBus.dispatch("authorisedChanged", { message: true });
    }
};

export {
    getClientID,
    refreshToken,
    getAccessToken,
    isAuthorized,
    authorize,
    unauthorize,
    onMountCheckUrl,
    onMountCheckUserStatus,
};
