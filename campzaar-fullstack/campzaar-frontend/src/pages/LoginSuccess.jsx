import { useEffect } from "react";

export default function LoginSuccess() {

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token"); // priyal

    if (token) {
      localStorage.setItem("cz_token", token); // priyal
      window.location.href = "/"; // priyal
    }
  }, []);

  return <h2 style={{ textAlign: "center", marginTop: "100px" }}>Logging you in...</h2>;
}