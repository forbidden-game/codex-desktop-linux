use crate::{
    cli::{Cli, Commands},
    config::{RuntimeConfig, RuntimePaths},
    logging,
    state::PersistedState,
};
use anyhow::Result;
use tracing::info;

pub async fn run(cli: Cli) -> Result<()> {
    let paths = RuntimePaths::detect()?;
    paths.ensure_dirs()?;
    logging::init(&paths.log_file)?;

    let config = RuntimeConfig::load_or_default(&paths)?;
    let mut state =
        PersistedState::load_or_default(&paths.state_file, config.auto_install_on_app_exit)?;

    match cli.command {
        Commands::Daemon => run_daemon(&config, &mut state, &paths).await,
        Commands::CheckNow => run_check_now(&config, &mut state, &paths).await,
        Commands::Status { json } => run_status(state, json),
        Commands::InstallDeb { path } => run_install_deb(path, &mut state, &paths).await,
    }
}

async fn run_daemon(
    config: &RuntimeConfig,
    state: &mut PersistedState,
    paths: &RuntimePaths,
) -> Result<()> {
    state.auto_install_on_app_exit = config.auto_install_on_app_exit;
    state.save(&paths.state_file)?;
    info!("daemon initialized");
    Ok(())
}

async fn run_check_now(
    config: &RuntimeConfig,
    state: &mut PersistedState,
    paths: &RuntimePaths,
) -> Result<()> {
    state.auto_install_on_app_exit = config.auto_install_on_app_exit;
    state.save(&paths.state_file)?;
    info!("check-now scaffold initialized");
    Ok(())
}

fn run_status(state: PersistedState, json: bool) -> Result<()> {
    if json {
        println!("{}", serde_json::to_string_pretty(&state)?);
    } else {
        println!("status: {:?}", state.status);
        println!("installed_version: {}", state.installed_version);
        println!(
            "candidate_version: {}",
            state.candidate_version.as_deref().unwrap_or("none")
        );
    }

    Ok(())
}

async fn run_install_deb(
    path: std::path::PathBuf,
    state: &mut PersistedState,
    paths: &RuntimePaths,
) -> Result<()> {
    anyhow::ensure!(path.exists(), "Debian package not found: {}", path.display());
    state.artifact_paths.deb_path = Some(path);
    state.save(&paths.state_file)?;
    info!("install-deb scaffold initialized");
    Ok(())
}
