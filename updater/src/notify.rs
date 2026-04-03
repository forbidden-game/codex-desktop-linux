//! Desktop notification helpers used by the updater daemon.

use anyhow::Result;
use notify_rust::Hint;
use std::path::{Path, PathBuf};

const APP_NAME: &str = "Codex Desktop";
const DESKTOP_ENTRY: &str = "codex-desktop";
const PACKAGED_BUNDLE_ICON_PATH: &str = "/opt/codex-desktop/.codex-linux/codex-desktop.png";
const SYSTEM_ICON_PATH: &str = "/usr/share/icons/hicolor/256x256/apps/codex-desktop.png";

/// Sends a desktop notification through the host notification service.
pub fn send(summary: &str, body: &str) -> Result<()> {
    let icon = resolve_icon();

    notify_rust::Notification::new()
        .summary(summary)
        .body(body)
        .appname(APP_NAME)
        .icon(&icon)
        .hint(Hint::DesktopEntry(DESKTOP_ENTRY.to_owned()))
        .show()?;
    Ok(())
}

fn resolve_icon() -> String {
    bundled_icon_candidates()
        .into_iter()
        .find(|path| path.is_file())
        .map(|path| path.display().to_string())
        .unwrap_or_else(|| DESKTOP_ENTRY.to_owned())
}

fn bundled_icon_candidates() -> Vec<PathBuf> {
    let mut candidates = vec![
        PathBuf::from(PACKAGED_BUNDLE_ICON_PATH),
        PathBuf::from(SYSTEM_ICON_PATH),
    ];

    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(repo_icon) = repo_icon_from_exe(&current_exe) {
            candidates.push(repo_icon);
        }
    }

    candidates
}

fn repo_icon_from_exe(current_exe: &Path) -> Option<PathBuf> {
    let target_dir = current_exe.parent()?.parent()?;
    Some(target_dir.parent()?.join("assets/codex.png"))
}
