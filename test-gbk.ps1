# 测试 GBK 编码的 HTTP 请求

$json = '{"name":"张三","message":"你好世界"}'
Write-Host "原始 JSON: $json"

# 转换为 GBK 编码
$encoding = [System.Text.Encoding]::GetEncoding('gbk')
$gbkBytes = $encoding.GetBytes($json)
Write-Host "GBK 字节数: $($gbkBytes.Length)"

# 发送请求
try {
  $response = Invoke-WebRequest `
    -Uri 'http://localhost:9999/api/gbk-json' `
    -Method Post `
    -Body $gbkBytes `
    -Headers @{
    'Content-Type' = 'application/json; charset=gbk'
  } `
    -UseBasicParsing

  Write-Host "`n响应状态: $($response.StatusCode)"
  Write-Host "响应内容:"
  $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
}
catch {
  Write-Host "错误: $_"
  Write-Host "详细信息: $($_.Exception.Message)"
}
