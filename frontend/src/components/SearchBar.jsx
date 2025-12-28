import SearchIcon from "../assets/search-icon.png";

export default function SearchBar({ query, setQuery }) {
  return (
    <div style={{ position: "relative", width: "50%" }}>
      <img
        src={SearchIcon}
        alt="Search"
        style={{
          position: "absolute",
          left: "-30px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "35px",
          height: "35px",
          pointerEvents: "none" // allows clicking inside input
        }}
      />

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          height: "50px",
          paddingLeft: "3rem", // space for icon
          paddingRight: "1rem",
          border: "3px solid black",
          borderRadius: "25px",
          fontSize: "1rem",
          marginLeft: "-45px"
        }}
      />
    </div>
  );
}
