import React from "react";
import './login.css'

export default function Login ()  {
    return(
       <div className="app">
            <div className="login-container">
                <h2>Se connecter</h2>
                <form action="">
                    <input type="username" placeholder="username"/>
                    <input type="password" placeholder="votre mot de passe" />
                    <button>ENVOYEZ</button>
                </form>
            </div>
       </div>
    )
}    