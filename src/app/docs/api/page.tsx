import { EndpointBlock, Callout } from "../components";

export default function ApiReferencePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold tracking-tight">API Reference</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Complete reference for all CronPulse API endpoints.
      </p>

      <div className="mt-6">
        <Callout type="info">
          <strong className="text-foreground">Authentication:</strong> Most
          endpoints require a valid session. The ping endpoint is public.
        </Callout>
      </div>

      <div className="mt-10 space-y-12">
        {/* Ping */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Ping</h2>
          <div className="space-y-6">
            <EndpointBlock
              method="GET"
              path="/api/ping/:pingUrl"
              description="Record a heartbeat ping from a cron job. Updates the monitor status to healthy and stores a ping record. Also supports POST."
              response={`{ "status": "ok" }`}
            />
          </div>
        </div>

        {/* Auth */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Authentication</h2>
          <div className="space-y-6">
            <EndpointBlock
              method="POST"
              path="/api/auth/signup"
              description="Create a new account with email and password. Automatically creates a default project and email alert channel."
              body={`{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "min8characters"
}`}
              response={`{ "success": true }`}
            />
          </div>
        </div>

        {/* Monitors */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Monitors</h2>
          <div className="space-y-6">
            <EndpointBlock
              method="GET"
              path="/api/jobs"
              description="List all monitors for a project."
              auth
              queryParams="projectId=<project-id>"
              response={`[
  {
    "id": "abc123",
    "name": "Database Backup",
    "status": "healthy",
    "schedule": "0 0 * * *",
    "gracePeriod": 300,
    "pingUrl": "xyz789",
    "lastPingAt": "2026-03-12T10:00:00.000Z",
    "createdAt": "2026-03-01T00:00:00.000Z"
  }
]`}
            />

            <EndpointBlock
              method="POST"
              path="/api/jobs"
              description="Create a new monitor. Returns the monitor with its unique ping URL."
              auth
              body={`{
  "projectId": "<project-id>",
  "name": "Database Backup",
  "schedule": "0 0 * * *",
  "gracePeriod": 300
}`}
              response={`{
  "id": "abc123",
  "name": "Database Backup",
  "status": "pending",
  "schedule": "0 0 * * *",
  "gracePeriod": 300,
  "pingUrl": "xyz789",
  "lastPingAt": null,
  "createdAt": "2026-03-12T10:00:00.000Z"
}`}
            />

            <EndpointBlock
              method="GET"
              path="/api/jobs/:id"
              description="Get a single monitor by ID."
              auth
              response={`{
  "id": "abc123",
  "name": "Database Backup",
  "status": "healthy",
  "schedule": "0 0 * * *",
  "gracePeriod": 300,
  "pingUrl": "xyz789",
  "lastPingAt": "2026-03-12T10:00:00.000Z"
}`}
            />

            <EndpointBlock
              method="PATCH"
              path="/api/jobs/:id"
              description="Update a monitor. All fields are optional."
              auth
              body={`{
  "name": "Updated Name",
  "schedule": "*/10 * * * *",
  "gracePeriod": 600
}`}
              response={`{
  "id": "abc123",
  "name": "Updated Name",
  "schedule": "*/10 * * * *",
  "gracePeriod": 600,
  ...
}`}
            />

            <EndpointBlock
              method="DELETE"
              path="/api/jobs/:id"
              description="Delete a monitor."
              auth
              response={`{ "message": "Monitor deleted" }`}
            />
          </div>
        </div>

        {/* Alert Channels */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Alert Channels</h2>
          <div className="space-y-6">
            <EndpointBlock
              method="GET"
              path="/api/alert-channels"
              description="List all alert channels for a project."
              auth
              queryParams="projectId=<project-id>"
              response={`[
  {
    "id": "ch_123",
    "type": "email",
    "config": { "email": "user@example.com" },
    "enabled": true
  },
  {
    "id": "ch_456",
    "type": "discord",
    "config": { "webhookUrl": "https://discord.com/api/webhooks/..." },
    "enabled": true
  }
]`}
            />

            <EndpointBlock
              method="POST"
              path="/api/alert-channels"
              description="Create a new alert channel. The request body varies by channel type."
              auth
              body={`// Email
{ "type": "email", "projectId": "...", "email": "user@example.com" }

// Discord
{ "type": "discord", "projectId": "...", "webhookUrl": "https://discord.com/api/webhooks/..." }

// Slack
{ "type": "slack", "projectId": "...", "webhookUrl": "https://hooks.slack.com/..." }

// Telegram
{ "type": "telegram", "projectId": "...", "botToken": "...", "chatId": "..." }

// Webhook
{ "type": "webhook", "projectId": "...", "url": "https://...", "label": "My Hook" }`}
            />

            <EndpointBlock
              method="PATCH"
              path="/api/alert-channels/:id"
              description="Toggle a channel on or off."
              auth
              body={`{ "enabled": false }`}
            />

            <EndpointBlock
              method="DELETE"
              path="/api/alert-channels/:id"
              description="Delete an alert channel."
              auth
              response={`{ "message": "Alert channel deleted" }`}
            />
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Alerts</h2>
          <div className="space-y-6">
            <EndpointBlock
              method="GET"
              path="/api/alerts"
              description="List alert history for a project with pagination."
              auth
              queryParams="projectId=<project-id>&page=1"
              response={`{
  "alerts": [
    {
      "id": "al_123",
      "status": "sent",
      "monitorName": "Database Backup",
      "monitorStatus": "down",
      "channelType": "discord",
      "attempts": 1,
      "sentAt": "2026-03-12T10:10:00.000Z",
      "createdAt": "2026-03-12T10:10:00.000Z"
    }
  ],
  "total": 15,
  "hasMore": true
}`}
            />
          </div>
        </div>

        {/* Error Responses */}
        <div>
          <h2 className="mb-6 text-2xl font-semibold">Error Responses</h2>
          <p className="text-sm text-muted-foreground">
            All error responses follow this format:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left">
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-yellow-400">400</code>
                  </td>
                  <td className="py-2.5">Invalid input — check the request body or query params</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-yellow-400">401</code>
                  </td>
                  <td className="py-2.5">Unauthorized — not signed in</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-yellow-400">403</code>
                  </td>
                  <td className="py-2.5">Forbidden — you don&apos;t own this resource</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-yellow-400">404</code>
                  </td>
                  <td className="py-2.5">Not found</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-yellow-400">409</code>
                  </td>
                  <td className="py-2.5">Conflict — resource already exists (e.g. duplicate email)</td>
                </tr>
                <tr className="border-b border-border/15">
                  <td className="py-2.5 pr-4">
                    <code className="text-yellow-400">429</code>
                  </td>
                  <td className="py-2.5">Rate limited — 1 ping per second per monitor</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
