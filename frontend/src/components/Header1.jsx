import React from "react";
import logo from "../assets/worksyde.png";

const Header1 = () => {
  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container-fluid">
        <a className="navbar-brand me-auto" href="#">
          <img src={logo} alt="Worksyde Logo" height={40} />
        </a>
      </div>
    </nav>
  )
}

export default Header1