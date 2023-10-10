import React from "react";  
import './register.css';


export default function Register (){
    return(
       <div className="app-register">
        <div className="register-container">
            <h2>Créer un compte</h2>    
            <form action="">
                <input type="email" placeholder="exemple@gmail.com"/>
                <input type="username" placeholder="username"/>
                <input type="password" placeholder="votre mot de passe" />
                <button>ENVOYEZ</button>
            </form>
        </div>
       </div>
    )
}