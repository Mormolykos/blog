<#
    deploy.ps1 — the only supported way to publish ai.bedvibe.studio.

    Until 2026-08-15 the deploy was a command copied out of a markdown file by
    hand. That is fine until the day it isn't: a hand-typed deploy is how a page
    gets published from a stale tree, and how someone reaches for `rsync --delete`
    to "clean up" and takes the search-engine verification files with it.

        .\scripts\deploy.ps1              # typecheck, build, check, upload
        .\scripts\deploy.ps1 -DryRun      # everything except the upload
        .\scripts\deploy.ps1 -Force       # upload even if the article count dropped

    NEVER use rsync --delete or scp with any delete flag against this target.
    BingSiteAuth.xml and f435b2689624afd162586cc8070b7d7d.txt are search-engine
    verification files. They are in public/ so a build carries them, but a delete
    pass that runs before a build does not care.
#>
param(
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$remote = 'root@91.99.83.114'
$target = '/var/www/ai-blog'
$ssh = 'C:\Windows\System32\OpenSSH\ssh.exe'
$scp = 'C:\Windows\System32\OpenSSH\scp.exe'

Set-Location $root

Write-Host "[1/5] typecheck" -ForegroundColor Cyan
& npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "tsc failed - nothing was built or uploaded" }

Write-Host "[2/5] build" -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed - nothing was uploaded" }

# The guard that matters. site-data.json is the article registry, and a stale or
# truncated copy of it produces a clean, successful build that is simply missing
# articles - no error, no warning, and the loss is only visible on the live site.
# Comparing what was just built against what is already published catches exactly
# that, and costs one ssh round trip.
Write-Host "[3/5] article count vs live" -ForegroundColor Cyan
$built = @(Get-ChildItem -Path 'dist' -Directory |
           Where-Object { $_.Name -ne 'articles' -and (Test-Path "$($_.FullName)\index.html") }).Count
$live = [int](& $ssh -o BatchMode=yes $remote "ls -d $target/*/ 2>/dev/null | grep -v '/articles/$' | wc -l")
Write-Host "      built $built article pages, live has $live"
if ($built -lt $live -and -not $Force) {
    throw ("REFUSING TO DEPLOY: the build has $built article pages but the live site has $live. " +
           "Something removed articles from src/data/site-data.json. Check it before re-running. " +
           "If the removal is deliberate, re-run with -Force.")
}

if ($DryRun) {
    Write-Host "[4/5] DRY RUN - nothing uploaded" -ForegroundColor Yellow
    Write-Host "[5/5] done" -ForegroundColor Green
    exit 0
}

Write-Host "[4/5] upload" -ForegroundColor Cyan
& $scp -o BatchMode=yes -r 'dist/.' "${remote}:$target/"
if ($LASTEXITCODE -ne 0) { throw "scp failed - the site may be half-updated, re-run" }

Write-Host "[5/5] ownership + verify" -ForegroundColor Cyan
& $ssh -o BatchMode=yes $remote "chown -R www-data:www-data $target"
$code = (& $ssh -o BatchMode=yes $remote "curl -s -o /dev/null -w '%{http_code}' https://ai.bedvibe.studio/").Trim()
Write-Host "      homepage returns $code"
if ($code -ne '200') { throw "homepage did not return 200 after deploy" }
Write-Host "DEPLOYED" -ForegroundColor Green
