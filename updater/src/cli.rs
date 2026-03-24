use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Debug, Parser)]
#[command(name = "codex-update-manager")]
#[command(about = "Local update manager for Codex Desktop on Linux")]
pub struct Cli {
    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Debug, Subcommand)]
pub enum Commands {
    Daemon,
    CheckNow,
    Status {
        #[arg(long)]
        json: bool,
    },
    InstallDeb {
        #[arg(long)]
        path: PathBuf,
    },
}
