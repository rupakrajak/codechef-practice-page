import React, { Component } from "react";
import ReactDOM from "react-dom";
import Navbar from "./Navbar";
import Content from "./Content";

class CodeChefPracticePage extends Component {
    render() {
        return (
            <div>
                <Navbar />
                <Content />
            </div>
        );
    }
}

export default CodeChefPracticePage;
