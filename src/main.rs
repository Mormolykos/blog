use axum::{
    Router,
    serve,
};
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::services::ServeDir;

#[tokio::main]
async fn main() {
    // Serve static files from the "static" folder
    let static_files = ServeDir::new("static");

    // Build the application router
    let app = Router::new().fallback_service(static_files);

    // 🟢 Use port 3000 as originally specified
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("🚀 Server running at http://{}", addr);

    // Serve the app
    serve(listener, app).await.unwrap();
}
