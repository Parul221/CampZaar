import Lottie from "lottie-react";
import animationData from "../assets/hello.json"; // priyal

export default function AnimatedMascot() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: "10px"
    }}>
      
      <Lottie 
  animationData={animationData}
  loop={true}
  style={{
    width: "140%", 
    maxWidth: 900,
    transform: "translateY(-70px)", // priyal
    height: "680px" // priyal
  }} 
/>
      <h3 style={{ color: "white", textAlign: "center" }}>
        Find your next deal 👋
      </h3>

    </div>
  );
}