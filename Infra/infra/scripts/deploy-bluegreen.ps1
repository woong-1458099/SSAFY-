param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("blue", "green")]
    [string]$TargetColor,
    [Parameter(Mandatory = $true)]
    [string]$Ec2Host,
    [Parameter(Mandatory = $true)]
    [string]$Ec2User,
    [Parameter(Mandatory = $true)]
    [string]$Ec2KeyPath,
    [Parameter(Mandatory = $true)]
    [string]$RemoteProjectDir
)

$targetService = "api-$TargetColor"
$activeConf = @"
upstream api_upstream {
  server $targetService:8080;
}
"@

$escapedConf = $activeConf.Replace('"', '\"')
$remoteCmd = "cd $RemoteProjectDir && printf ""$escapedConf"" > Infra/infra/nginx/upstreams/active.conf && docker compose -f compose.dev.yml up -d $targetService nginx && docker compose -f compose.dev.yml restart nginx"

ssh -i $Ec2KeyPath "$Ec2User@$Ec2Host" $remoteCmd
