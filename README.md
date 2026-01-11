# n8n-nodes-bitwarden

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for Bitwarden, the open-source password manager and secrets management platform. This node enables workflow automation for organization management, member provisioning, collection administration, SSO configuration, directory sync, and Secrets Manager integration through Bitwarden's Public API.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![Bitwarden](https://img.shields.io/badge/Bitwarden-API-175DDC)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Member Management**: Invite, confirm, update, revoke, and restore organization members with collection and group access control
- **Collection Administration**: Create, update, delete collections with granular member and group access permissions
- **Group Management**: Organize members into groups with bulk operations and collection access configuration
- **Policy Configuration**: Configure organization security policies including 2FA, master password requirements, SSO, and vault timeout
- **Event Monitoring**: Query and filter organization audit events by date range, member, or event type
- **Organization Settings**: Manage organization details, billing, subscription, and API keys
- **SSO Configuration**: Configure OpenID Connect and SAML 2.0 single sign-on with Key Connector support
- **Directory Sync**: Configure and trigger directory synchronization with Azure AD, Okta, OneLogin, GSuite, and more
- **Secrets Manager**: Manage secrets, projects, and service accounts for DevOps credential management
- **Import/Export**: Bulk import and export organization vault data and member lists
- **Multi-Environment Support**: Works with Bitwarden Cloud (US/EU) and self-hosted instances
- **Trigger Node**: Poll for organization events with configurable event type filtering

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Select **Install**
4. Enter `n8n-nodes-bitwarden` in the input field
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-bitwarden
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-bitwarden.git
cd n8n-nodes-bitwarden

# Install dependencies
npm install

# Build the project
npm run build

# Create symlink to n8n custom nodes directory
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-bitwarden

# Restart n8n
```

## Credentials Setup

### Bitwarden API Credentials

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| Client ID | String | Yes | Organization API Client ID from Admin Console |
| Client Secret | String | Yes | Organization API Client Secret |
| Environment | Options | Yes | Cloud US, Cloud EU, or Self-hosted |
| Self-Hosted URL | String | Conditional | Required if using Self-hosted environment |

### Obtaining API Credentials

1. Log into the Bitwarden Web Vault as an organization owner
2. Navigate to **Admin Console** > **Settings** > **Organization info**
3. Scroll to the **API Key** section
4. Click **View API Key** or **Rotate API Key**
5. Copy the `client_id` and `client_secret` values

**Note**: The client_id format is `organization.{uuid}`

## Resources & Operations

### Members

| Operation | Description |
|-----------|-------------|
| Get All | List all organization members |
| Get | Get member by ID |
| Create | Invite new member to organization |
| Update | Update member details and permissions |
| Delete | Remove member from organization |
| Reinvite | Resend invitation to pending member |
| Confirm | Confirm an accepted member |
| Update Groups | Update member group assignments |
| Update Collections | Update member collection access |
| Revoke | Revoke member access |
| Restore | Restore a revoked member |

### Collections

| Operation | Description |
|-----------|-------------|
| Get All | List all collections |
| Get | Get collection by ID |
| Create | Create new collection |
| Update | Update collection |
| Delete | Delete collection |
| Get Members | Get members with access |
| Add Member | Add member to collection |
| Remove Member | Remove member from collection |
| Get Groups | Get groups with access |
| Update Groups | Update group access |

### Groups

| Operation | Description |
|-----------|-------------|
| Get All | List all groups |
| Get | Get group by ID |
| Create | Create new group |
| Update | Update group |
| Delete | Delete group |
| Get Members | Get members in group |
| Add Members | Add members to group |
| Remove Members | Remove members from group |
| Get Collections | Get collection access |
| Update Collections | Update collection access |

### Policies

| Operation | Description |
|-----------|-------------|
| Get All | List all policies |
| Get | Get policy by type |
| Update | Update policy configuration |

**Supported Policy Types**: Two-Factor Authentication, Master Password, Password Generator, Single Organization, Require SSO, Personal Ownership, Disable Send, Send Options, Reset Password, Maximum Vault Timeout, Disable Personal Vault Export, Activate Autofill

### Events

| Operation | Description |
|-----------|-------------|
| Get All | List organization events |
| Get By Date Range | Get events within date range |
| Get By Member | Get events for a specific member |
| Get By Type | Filter events by event type |

### Organization

| Operation | Description |
|-----------|-------------|
| Get | Get organization details |
| Update | Update organization settings |
| Get Billing | Get billing information |
| Get Subscription | Get subscription details |
| Get License | Get organization license |
| Rotate API Key | Rotate the organization API key |

### SSO Configuration

| Operation | Description |
|-----------|-------------|
| Get | Get SSO configuration |
| Update | Update SSO configuration |
| Get Metadata | Get SSO metadata |
| Test Connection | Test SSO connection |

**Supported SSO Types**: OpenID Connect, SAML 2.0

### Directory Sync

| Operation | Description |
|-----------|-------------|
| Get | Get directory configuration |
| Update | Update directory configuration |
| Sync | Trigger directory sync |
| Get Sync History | Get sync history |

**Supported Directory Types**: Azure Active Directory, Okta, OneLogin, GSuite, JumpCloud, Generic LDAP

### Secrets Manager - Secrets

| Operation | Description |
|-----------|-------------|
| Get All | List all secrets |
| Get | Get secret by ID |
| Create | Create new secret |
| Update | Update secret |
| Delete | Delete secret |
| Get By Project | Get secrets in project |

*Note: Requires Secrets Manager subscription*

### Secrets Manager - Projects

| Operation | Description |
|-----------|-------------|
| Get All | List all projects |
| Get | Get project by ID |
| Create | Create new project |
| Update | Update project |
| Delete | Delete project |
| Get Secrets | Get secrets in project |
| Get Service Accounts | Get service accounts with access |

### Secrets Manager - Service Accounts

| Operation | Description |
|-----------|-------------|
| Get All | List all service accounts |
| Get | Get service account by ID |
| Create | Create service account |
| Update | Update service account |
| Delete | Delete service account |
| Get Access Tokens | List access tokens |
| Create Access Token | Create new access token |
| Revoke Access Token | Revoke access token |

### Import/Export

| Operation | Description |
|-----------|-------------|
| Import Organization | Import organization vault data |
| Export Organization | Export organization vault |
| Import Members | Import members from CSV |
| Export Members | Export members to CSV |

## Trigger Node

The Bitwarden Trigger node polls for organization events at configurable intervals.

### Supported Events

- All Events
- Member Invited
- Member Accepted
- Member Confirmed
- Member Updated
- Member Removed
- Collection Created
- Collection Updated
- Collection Deleted
- Group Created
- Group Updated
- Group Deleted
- Policy Updated
- Organization Updated

### Configuration

| Property | Description |
|----------|-------------|
| Event | The event type to trigger on |
| Include Acting User Details | Optionally include details about the user who triggered the event |

## Usage Examples

### Invite a New Member

```javascript
// Workflow: HR System Integration
// When a new employee is added to HR system, invite them to Bitwarden

// Bitwarden Node Configuration
{
  "resource": "member",
  "operation": "create",
  "email": "{{$json.employeeEmail}}",
  "type": 2, // User
  "accessAll": false,
  "collections": [
    {
      "id": "department-collection-id",
      "readOnly": false,
      "hidePasswords": false,
      "manage": false
    }
  ]
}
```

### Sync Groups with Directory

```javascript
// Workflow: Nightly Directory Sync
// Trigger directory sync and check results

// Bitwarden Node Configuration - Trigger Sync
{
  "resource": "directorySync",
  "operation": "sync",
  "syncType": "incremental"
}

// Bitwarden Node Configuration - Get History
{
  "resource": "directorySync",
  "operation": "getSyncHistory"
}
```

### Monitor Security Events

```javascript
// Workflow: Security Alerting
// Send alerts for security-related events

// Bitwarden Trigger Configuration
{
  "event": "policyUpdated"
}

// Then route to Slack/Email for alerting
```

## Environment Support

| Environment | API Base URL | Identity URL |
|-------------|--------------|--------------|
| Cloud US | https://api.bitwarden.com | https://identity.bitwarden.com |
| Cloud EU | https://api.bitwarden.eu | https://identity.bitwarden.eu |
| Self-hosted | https://your.domain.com/api | https://your.domain.com/identity |

## Error Handling

The node handles common Bitwarden API errors:

| Error Code | Description | Handling |
|------------|-------------|----------|
| 400 | Bad Request | Validation error details returned |
| 401 | Unauthorized | Automatic token refresh and retry |
| 403 | Forbidden | Insufficient permissions error |
| 404 | Not Found | Resource not found error |
| 409 | Conflict | Resource conflict error |
| 429 | Rate Limited | Automatic retry with exponential backoff |

## Security Best Practices

1. **Credential Security**: Store API credentials securely in n8n's credential system
2. **Principle of Least Privilege**: Use organization accounts with minimal required permissions
3. **Audit Logging**: Monitor the Events resource for security-relevant activities
4. **Secure Self-Hosted**: If using self-hosted Bitwarden, ensure HTTPS is properly configured
5. **Rotate API Keys**: Periodically rotate organization API keys using the Organization resource

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode for development
npm run dev

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use

Permitted for personal, educational, research, and internal business use.

### Commercial Use

Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure all contributions comply with the BSL 1.1 license terms.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

- **Documentation**: [Bitwarden Public API Documentation](https://bitwarden.com/help/public-api/)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-bitwarden/issues)
- **Commercial Support**: licensing@velobpa.com

## Acknowledgments

- [Bitwarden](https://bitwarden.com/) for their excellent password management platform and API
- [n8n](https://n8n.io/) for the workflow automation platform
- The open-source community for continuous support and feedback
