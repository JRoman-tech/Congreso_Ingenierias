param(
    [string]$DbHost = "127.0.0.1",
    [string]$DbPort = "3307",
    [string]$DbUser = "root"
)

$securePassword = Read-Host "Contraseña de MySQL para $DbUser" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$previousDebug = $env:DEBUG

try {
    $env:DB_HOST = $DbHost
    $env:DB_PORT = $DbPort
    $env:DB_USER = $DbUser
    $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $env:DEBUG = "false"

    Write-Host "Iniciando Congreso de Ingenierías con MySQL en ${DbHost}:${DbPort}..."
    npm run dev
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
    if ($null -eq $previousDebug) {
        Remove-Item Env:DEBUG -ErrorAction SilentlyContinue
    } else {
        $env:DEBUG = $previousDebug
    }
}
