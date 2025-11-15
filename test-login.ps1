$headers = @{
    'Content-Type' = 'application/json'
}

$body = @{
    email = 'test@docente.com'
    password = 'password123'
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $body -Headers $headers
    Write-Output "Login successful!"
    Write-Output "User: $($response.user.email)"
    Write-Output "Role: $($response.user.role)"
    Write-Output "Token length: $($response.token.Length)"
} catch {
    Write-Output "Login failed: $($_.Exception.Message)"
    Write-Output "Response: $($_.Exception.Response.StatusCode)"
}