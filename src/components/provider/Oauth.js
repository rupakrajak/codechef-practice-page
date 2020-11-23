import axios from "axios";
import eventBus from "./../EventBus"

const grantTypes = ["authorization_code", "client_credentials"];

const oauthData = {
    api_authorize_endpoint: "https://api.codechef.com/oauth/authorize",
    api_token_endpoint: "https://api.codechef.com/oauth/token",
    response_type: "code",
    state: "axbycz",
    redirect_uri: "http://localhost:3000/",
    CLIENT_ID: "e5be626218040c638a6b2e47eb053caf",
    CLIENT_SECRET: "637a76c6da7edd0f4504ad649495233a",
};

let sessionData = {
    authorized: false,
    grant_type: grantTypes[1],
    ACCESS_TOKEN: "633e47a28c998c896940473dc7e1e5ed64a723ce",
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
        console.log(sessionData.ACCESS_TOKEN);
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
        return "success";
    } else {
        return "failure";
    }
};

const getAccessToken = () => {
    return sessionData.ACCESS_TOKEN;
};

const isAuthorized = () => {
    return sessionData.authorized;
};

const authorize = () => {
    window.location = `${oauthData.api_authorize_endpoint}?response_type=${oauthData.response_type}&client_id=${oauthData.CLIENT_ID}&state=${oauthData.state}&redirect_uri=${oauthData.redirect_uri}`;
};

const unauthorize = async() => {
    sessionData.authorized = false;
    sessionData.grant_type = grantTypes[1];
    let stat = await refreshToken();
    if (stat == 'success') {
        eventBus.dispatch("authorisedChanged", { message: true });
    }
}

// const completeAuthorization = () => {
//     // auth_window.close();
//     console.log(return_url);
// };

// let return_url, auth_window;

// const authorize = () => {
//     console.log(oauthData.api_authorize_endpoint);
//     const auth_url = `${oauthData.api_authorize_endpoint}?response_type=${oauthData.response_type}&client_id=${oauthData.CLIENT_ID}&state=${oauthData.state}&redirect_uri=${oauthData.redirect_uri}`;
//     // const config = {
//     //     params: {
//     //         response_type: this.oauthData.response_type,
//     //         client_id: this.oauthData.CLIENT_ID,
//     //         state: this.oauthData.state,
//     //         redirect_uri: this.oauthData.redirect_uri,
//     //     }
//     // }
//     auth_window = window.open(
//         auth_url,
//         "CodeChef | Login",
//         "width=1140, height=640"
//     );
//     auth_window.focus();
//     // auth_window.onbeforeunload = () => {
//     //     console.log("Hello");
//     //     return_url = auth_window.location;
//     //     completeAuthorization();
//     //     auth_window.close();
//     // };
//     auth_window.onbeforeunload = () => {
//         console.log("Hello");
//         return_url = auth_window.location.href;
//         completeAuthorization();
//         // auth_window.close();
//     };
// };

const onMountCheckUrl = async () => {
    const queryString = window.location.search;
    const paramList = new URLSearchParams(queryString);
    // console.log(queryString);
    // console.log(paramList.get('code'));
    if (paramList.has("code")) {
        let stat = await requestAccessToken(paramList.get("code"));
        if ((stat = "success")) {
            sessionData.authorized = true;
            sessionData.grant_type = grantTypes[0];
            eventBus.dispatch("authorisedChanged", { message: true });
        }
    }
};

export {
    refreshToken,
    getAccessToken,
    isAuthorized,
    authorize,
    unauthorize,
    onMountCheckUrl,
};
