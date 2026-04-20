$body = '{"email":"87602307@qq.com","password":"756357Wx."}';
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing;
$content = $response.Content;
Write-Output "Response: $content";
$token = ($content | ConvertFrom-Json).data.token;
Write-Output "Token: $token";
$token | Out-File -FilePath "token.txt" -Force;
Write-Output "Token saved to token.txt";