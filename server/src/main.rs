use axum::{
    routing::get,
    Router,
    response::Json,
};
use std::net::SocketAddr;
use serde::Serialize;

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    message: &'static str,
}

#[tokio::main]
async fn main() {
    // build our application with a route
    let app = Router::new()
        // `GET /` goes to `root`
        .route("/health", get(health_check));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        message: "2D Stellar Game Server Prototype Is Running",
    })
}
