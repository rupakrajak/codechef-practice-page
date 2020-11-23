import React, { Component } from "react";
import "./css/navbar.css";
import {
    authorize,
    isAuthorized,
    unauthorize,
    getAccessToken,
} from "./provider/Oauth";
import axios from "axios";
import Content from "./Content";
import eventBus from "./EventBus";

class Navbar extends Component {
    constructor() {
        super();
        this.value = "";
        this.state = {
            signedIn: false,
            username: "",
            stars: "",
        };
    }

    componentDidMount = () => {
        eventBus.on("authorisedChanged", (data) => this.checkAuthorized());
    };

    getUserDetails = async () => {
        let URL = "https://api.codechef.com/users/me";
        let config = {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer " + getAccessToken(),
            },
        };
        try {
            const resp = await axios.get(URL, config);
            return resp;
        } catch (error) {
            console.log("Some error occured!");
            console.log(error);
        }
    };

    checkAuthorized = async () => {
        if (isAuthorized() != this.state.signedIn) {
            let uname = "";
            let strs = "";
            if (isAuthorized() == true) {
                let dis = await this.getUserDetails();
                console.log(dis);
                console.log(
                    dis.data.result.data.content.band +
                        " " +
                        dis.data.result.data.content.username
                );
                uname = dis.data.result.data.content.username;
                strs = dis.data.result.data.content.band;
            }
            this.setState({
                signedIn: isAuthorized(),
                username: uname,
                stars: strs,
            });
        }
    };

    onClick = async (e) => {
        e.preventDefault();
        if (this.state.signedIn == false) {
            authorize();
        } else {
            unauthorize();
        }
    };

    onSearch = (val) => {
        if (val != "") eventBus.dispatch("searched", { message: val });
    };

    displayName = () => {
        if (this.state.signedIn == true) {
            return (
                <div id="username">
                    <h1>Hello</h1>
                    <div className={"b" + this.state.stars[0]}>
                        <h1>{this.state.stars}</h1>
                    </div>
                    <div className="uname">
                        <h1>{this.state.username}</h1>
                    </div>
                </div>
            );
        } else {
            console.log("here!");
            return <div></div>;
        }
    };

    button = () => {
        let buttonText = "";
        let classname = "";
        if (this.state.signedIn == true) {
            buttonText = "Sign out";
            classname = "ui button";
        } else {
            buttonText = "Sign in";
            classname = "ui primary button";
        }
        return (
            <div id="sign">
                {this.displayName()}
                <button className={classname} onClick={this.onClick}>
                    {buttonText}
                </button>
            </div>
        );
    };

    render() {
        return (
            <div id="navbar">
                <div id="upper-panel">
                    <div id="codecheflogo">
                        <img src="https://s3.amazonaws.com/codechef_shared/sites/all/themes/abessive/logo.svg"></img>
                        <inline>
                            <h1>Practice Page</h1>
                        </inline>
                    </div>
                    {this.button()}
                </div>
                <div id="lower-panel">
                    <div id="searchbar">
                        <input
                            id="searchinput"
                            type="text"
                            placeholder="Search tags..."
                            autoComplete="on"
                            autoFocus="autofocus"
                            onChange={(e) => {
                                this.value = e.target.value;
                            }}
                        ></input>
                        <button
                            id="searchbutton"
                            onClick={() => this.onSearch(this.value)}
                        >
                            Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default Navbar;
