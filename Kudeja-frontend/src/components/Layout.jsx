import Navbar from "./Navbar";

function Layout({ cartCount, children }) {
  return (
    <>
      <Navbar cartCount={cartCount} />

      <main style={{
        maxWidth: "1200px",
        margin: "auto",
        padding: "20px"
      }}>
        <div className="page-container">
          {children}
        </div>
      </main>
    </>
  );
}

export default Layout;
