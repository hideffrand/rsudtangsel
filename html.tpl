<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trivy Scan Report</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f6f8fa;
      margin: 0;
      padding: 24px;
      color: #1f2328;
    }
    .container {
      max-width: 1300px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
      padding: 32px 36px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: #1f2328;
    }
    .badge {
      display: inline-block;
      background: #e9ecef;
      border-radius: 40px;
      padding: 2px 16px;
      font-size: 14px;
      font-weight: 500;
      color: #495057;
      margin-left: 10px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 18px 44px;
      margin: 16px 0 24px 0;
      padding: 12px 0;
      border-top: 1px solid #e1e4e8;
      border-bottom: 1px solid #e1e4e8;
      font-size: 14px;
      color: #57606a;
    }
    .meta strong {
      color: #1f2328;
      font-weight: 600;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 20px 0 28px 0;
    }
    .card {
      flex: 1 1 120px;
      padding: 14px 16px;
      border-radius: 8px;
      background: #f8f9fa;
      text-align: center;
      border-left: 4px solid #d0d7de;
    }
    .card .count {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
    }
    .card .label {
      font-size: 12px;
      font-weight: 600;
      color: #57606a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card.critical { border-left-color: #cf222e; }
    .card.high     { border-left-color: #d1862b; }
    .card.medium   { border-left-color: #eac54f; }
    .card.low      { border-left-color: #218bff; }
    .card.unknown  { border-left-color: #8b949e; }
    .card.critical .count { color: #cf222e; }
    .card.high .count     { color: #d1862b; }
    .card.medium .count   { color: #9a7d0a; }
    .card.low .count      { color: #218bff; }
    .card.unknown .count  { color: #8b949e; }

    .table-wrap {
      overflow-x: auto;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      text-align: left;
      background: #f8f9fa;
      padding: 10px 12px;
      font-weight: 600;
      border-bottom: 2px solid #d0d7de;
      color: #1f2328;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e1e4e8;
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: #f8f9fa;
    }

    .severity-tag {
      display: inline-block;
      padding: 2px 12px;
      border-radius: 40px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .severity-tag.CRITICAL { background: #cf222e; color: #ffffff; }
    .severity-tag.HIGH    { background: #d1862b; color: #ffffff; }
    .severity-tag.MEDIUM  { background: #eac54f; color: #1f2328; }
    .severity-tag.LOW     { background: #218bff; color: #ffffff; }
    .severity-tag.UNKNOWN { background: #8b949e; color: #ffffff; }

    .cve-id {
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-weight: 600;
      color: #0a58ca;
      text-decoration: none;
      font-size: 13px;
    }
    .cve-id:hover {
      text-decoration: underline;
    }
    .pkg-name {
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      color: #1f2328;
    }
    .fixed-version {
      color: #1a7f37;
      font-weight: 600;
    }
    .no-fixed {
      color: #cf222e;
      font-weight: 600;
    }
    .title-text {
      max-width: 320px;
      word-break: break-word;
      color: #495057;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #57606a;
    }
    .empty-state .icon {
      font-size: 36px;
      margin-bottom: 8px;
    }
    .empty-state p {
      margin: 0;
      font-size: 16px;
    }

    .target-section {
      margin-bottom: 28px;
    }
    .target-section:not(:last-child) {
      border-bottom: 1px dashed #d0d7de;
      padding-bottom: 24px;
    }
    .target-header {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 10px 0;
      color: #1f2328;
    }
    .target-header .type {
      font-weight: 400;
      font-size: 13px;
      color: #57606a;
      margin-left: 8px;
    }

    .footer {
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #e1e4e8;
      font-size: 13px;
      color: #57606a;
      text-align: center;
    }

    @media (max-width: 640px) {
      body { padding: 12px; }
      .container { padding: 16px; }
      .card { flex: 1 1 100%; }
      th, td { padding: 6px 8px; font-size: 12px; }
      .meta { gap: 8px 16px; font-size: 13px; }
    }
    @media print {
      body { background: #ffffff; padding: 10px; }
      .container { box-shadow: none; padding: 16px; }
    }
  </style>
</head>
<body>
<div class="container">

  <h1>
    Trivy Vulnerability Report
    <span class="badge">{{len .Results}} target(s)</span>
  </h1>

  <div class="meta">
    <span><strong>Scanned:</strong> {{now | date "2006-01-02 15:04:05"}}</span>
    <span><strong>Trivy:</strong> v0.74.0</span>
    <span><strong>Targets:</strong> {{len .Results}}</span>
  </div>

  {{- $globalCritical := 0 -}}
  {{- $globalHigh := 0 -}}
  {{- $globalMedium := 0 -}}
  {{- $globalLow := 0 -}}
  {{- $globalUnknown := 0 -}}

  {{- range .Results -}}
    {{- range .Vulnerabilities -}}
      {{- if eq .Severity "CRITICAL" -}} {{- $globalCritical = add $globalCritical 1 -}} {{- end -}}
      {{- if eq .Severity "HIGH" -}} {{- $globalHigh = add $globalHigh 1 -}} {{- end -}}
      {{- if eq .Severity "MEDIUM" -}} {{- $globalMedium = add $globalMedium 1 -}} {{- end -}}
      {{- if eq .Severity "LOW" -}} {{- $globalLow = add $globalLow 1 -}} {{- end -}}
      {{- if eq .Severity "UNKNOWN" -}} {{- $globalUnknown = add $globalUnknown 1 -}} {{- end -}}
    {{- end -}}
  {{- end -}}

  <div class="summary">
    <div class="card critical"><div class="count">{{$globalCritical}}</div><div class="label">Critical</div></div>
    <div class="card high"><div class="count">{{$globalHigh}}</div><div class="label">High</div></div>
    <div class="card medium"><div class="count">{{$globalMedium}}</div><div class="label">Medium</div></div>
    <div class="card low"><div class="count">{{$globalLow}}</div><div class="label">Low</div></div>
    <div class="card unknown"><div class="count">{{$globalUnknown}}</div><div class="label">Unknown</div></div>
  </div>

  <h2 style="font-size:18px; font-weight:600; margin:0 0 14px 0; color:#1f2328;">Vulnerability Details</h2>

  {{- if .Results -}}
    {{- range $idx, $result := .Results -}}
      {{- if $result.Vulnerabilities -}}
        <div class="target-section">
          <div class="target-header">
            Target: {{$result.Target}}
            {{- if $result.Type -}}
              <span class="type">({{$result.Type}})</span>
            {{- end -}}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Package</th>
                  <th>Severity</th>
                  <th>Installed</th>
                  <th>Fixed</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
              {{- range $result.Vulnerabilities -}}
                <tr>
                  <td><a href="https://nvd.nist.gov/vuln/detail/{{.VulnerabilityID}}" class="cve-id" target="_blank" rel="noopener">{{.VulnerabilityID}}</a></td>
                  <td><span class="pkg-name">{{.PkgName}}</span></td>
                  <td><span class="severity-tag {{.Severity}}">{{.Severity}}</span></td>
                  <td>{{.InstalledVersion}}</td>
                  <td>{{if .FixedVersion}}<span class="fixed-version">{{.FixedVersion}}</span>{{else}}<span class="no-fixed">No fixed</span>{{end}}</td>
                  <td class="title-text">{{.Title}}</td>
                </tr>
              {{- end -}}
              </tbody>
            </table>
          </div>
        </div>
      {{- end -}}
    {{- end -}}
  {{- else -}}
    <div class="empty-state">
      <div style="font-size:36px; margin-bottom:8px;">&#x2714;</div>
      <p>No vulnerabilities found.</p>
    </div>
  {{- end -}}

  <div class="footer">
    Generated by Trivy v0.74.0 &bull; Report for {{len .Results}} target(s)
  </div>

</div>
</body>
</html>