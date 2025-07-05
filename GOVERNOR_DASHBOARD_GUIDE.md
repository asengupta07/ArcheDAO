# Enhanced Governor Dashboard Guide

## Overview

The enhanced Governor Dashboard provides comprehensive DAO management capabilities with proper smart contract integration, enum parsing, and role-based access control. This dashboard allows DAO Creators and Governors to manage their DAOs with real-time data from the Aptos blockchain.

## Features

### 🔐 Role-Based Access Control
- **DAO Creator**: Full administrative control with ownership transfer capabilities
- **Governor**: Administrative control over DAO operations 
- **Member**: No access to governor dashboard (redirected to member dashboard)

### 📊 Smart Contract Integration
- Real-time data fetching from Aptos blockchain
- Proper enum parsing for all status values
- Automatic data refresh capabilities
- Transaction execution with proper error handling

### 🏛️ DAO Management Features

#### For DAO Creators (Highest Privileges)
- **Member Promotion**: Promote members to governor role
- **Governor Demotion**: Demote governors to member role (cannot demote creator)
- **Ownership Transfer**: Transfer DAO ownership to another member (irreversible)
- **Invite Link Generation**: Create shareable links for new member recruitment
- **Full DAO Settings Access**: View and understand governance parameters

#### For Governors
- **Invite Link Generation**: Create shareable links for new member recruitment
- **Member Overview**: View all DAO members and their roles
- **Proposal Monitoring**: View all proposals with proper status parsing
- **Task Management**: View all tasks with status tracking

## Enum Parsing Implementation

### User Types
```typescript
USER_TYPES = {
  MEMBER: 0,        // Regular member
  GOVERNOR: 1,      // Governor with admin privileges  
  DAO_CREATOR: 2    // Creator with full control
}
```

### Proposal Status
```typescript
PROPOSAL_STATUS = {
  PENDING: 0,       // Waiting to start
  ACTIVE: 1,        // Currently accepting votes
  PASSED: 2,        // Proposal passed
  REJECTED: 3,      // Proposal rejected
  EXECUTED: 4,      // Proposal executed
  CANCELED: 5       // Proposal canceled
}
```

### Task Status  
```typescript
TASK_STATUS = {
  OPEN: 0,          // Available for assignment
  IN_PROGRESS: 1,   // Currently being worked on
  COMPLETED: 2,     // Task completed
  CANCELED: 3       // Task canceled
}
```

### Vote Types
```typescript
VOTE_TYPES = {
  FOR: 0,           // Vote in favor
  AGAINST: 1,       // Vote against
  ABSTAIN: 2        // Abstain from voting
}
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the project root:

```env
# Smart Contract Configuration
NEXT_PUBLIC_MODULE_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_MODULE_NAME=contracts  
NEXT_PUBLIC_ADMIN_ADDRESS=your_admin_wallet_address

# Network Configuration
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_NODE_URL=https://api.devnet.aptoslabs.com/v1
```

### 2. Contract Deployment

Ensure your smart contract is deployed and initialized:

1. Deploy the contract to Aptos devnet
2. Initialize the platform using the admin account
3. Update the environment variables with correct addresses

### 3. User Registration

Users must be registered in the system:
- Join a DAO using invite codes
- Get promoted to governor by DAO creator
- Creators automatically get access when creating DAOs

## Dashboard Sections

### 1. Header & Navigation
- **Current Role Display**: Shows user's role (Creator/Governor)
- **DAO Selection**: Switch between multiple DAOs if applicable
- **Refresh Button**: Manually refresh blockchain data
- **Wallet Information**: Connected wallet address

### 2. DAO Overview Card
- **DAO Status**: Active/Inactive with proper enum parsing
- **Creation Date**: When the DAO was established  
- **Governance Token**: Contract address display
- **Total Token Supply**: Total governance tokens issued
- **Governance Settings**: Voting periods, execution delays, thresholds

### 3. Key Metrics Grid
- **Total Members**: Current DAO membership count
- **Treasury Balance**: DAO treasury in APT tokens
- **Total Proposals**: Number of governance proposals
- **Total Tasks**: Number of tasks created

### 4. Management Actions

#### Invite Members
- Generate shareable invite links
- Links include DAO code and ID for automatic joining
- Copy-to-clipboard functionality

#### Promote to Governor (DAO Creator Only)
- Enter member address to promote
- Automatic role elevation in smart contract
- Real-time UI updates after transaction

#### Transfer Ownership (DAO Creator Only)  
- Transfer full DAO ownership to another member
- **WARNING**: This action is irreversible
- New owner gains all creator privileges

### 5. Governors List
- **Governor Display**: All current governors with addresses
- **Role Badges**: Visual indicators for Creator vs Governor
- **Demotion Controls**: DAO creators can demote governors (except themselves)

### 6. Proposals Section
- **Status Parsing**: Proper enum-based status display with colors
- **Voting Progress**: Visual progress bars for vote tallies
- **Proposal Details**: Title, description, proposer information
- **Timeline Display**: Creation and end dates
- **Vote Breakdown**: For/Against/Total vote counts

### 7. Tasks Section  
- **Status Parsing**: Proper enum-based status display with colors
- **Task Details**: Title, description, creator, assignee
- **Reward Information**: Task rewards in APT tokens
- **Deadline Tracking**: Task completion deadlines
- **Timeline Display**: Creation and completion dates

### 8. Recent Members
- **Member List**: Recent DAO members with addresses
- **Role Indicators**: Visual badges for Member/Governor roles
- **Address Display**: Shortened wallet addresses for readability

## Error Handling

### Transaction Errors
- **Network Issues**: Automatic retry suggestions
- **Insufficient Permissions**: Clear error messages
- **Invalid Addresses**: Address validation feedback
- **Contract Errors**: Smart contract error parsing

### Data Loading
- **Loading States**: Visual loading indicators
- **Empty States**: Helpful messages when no data exists
- **Refresh Capabilities**: Manual and automatic data refresh

## Security Features

### Access Control
- **Wallet Connection Required**: Must connect wallet to access
- **Role Verification**: Server-side role validation
- **Permission Checks**: Function-level permission verification

### Data Validation  
- **Address Validation**: Ensures valid Aptos addresses
- **Input Sanitization**: Prevents malicious input
- **Transaction Confirmation**: User confirmation for critical actions

## Usage Examples

### Promoting a Member to Governor
1. Connect as DAO Creator
2. Navigate to "Promote to Governor" section
3. Enter member's wallet address
4. Click "Promote" button
5. Confirm transaction in wallet
6. Wait for blockchain confirmation

### Generating Invite Links
1. Connect as Creator or Governor
2. Click "Generate Invite Link" 
3. Copy the generated link
4. Share with potential members
5. Members can join using the link

### Monitoring Proposals
1. View proposals in the Proposals section
2. Check status using color-coded badges:
   - 🟡 Pending - Not yet started
   - 🟢 Active - Currently voting
   - 🔵 Passed - Proposal successful
   - 🔴 Rejected - Proposal failed
   - 🟣 Executed - Changes implemented
   - ⚫ Canceled - Proposal canceled

## Troubleshooting

### Common Issues

#### "Access Denied" Error
- **Cause**: User doesn't have Governor or Creator role
- **Solution**: Get promoted by DAO Creator or create your own DAO

#### "Error Loading Data" 
- **Cause**: Network connection or contract issues
- **Solution**: Check wallet connection and network status

#### Transaction Failures
- **Cause**: Insufficient gas, invalid parameters, or network issues
- **Solution**: Check gas balance, verify addresses, try again

#### Empty Data Sections
- **Cause**: DAO might not have proposals/tasks yet
- **Solution**: This is normal for new DAOs

### Getting Help

1. **Check Environment Variables**: Ensure all contract addresses are correct
2. **Verify Network**: Confirm you're on the right Aptos network
3. **Check Wallet**: Ensure wallet is connected and has sufficient gas
4. **Smart Contract Status**: Verify contract is deployed and initialized

## Development Notes

### Code Structure
- **Contract Configuration**: `/config/contract.ts` - All contract constants and helpers
- **Governor Page**: `/app/dao/governor/page.tsx` - Main dashboard component
- **Enum Parsing**: Automated conversion of numeric enums to readable labels
- **Type Safety**: Full TypeScript interfaces for all data structures

### Future Enhancements
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: Filter proposals/tasks by status
- **Bulk Actions**: Manage multiple members simultaneously
- **Analytics Dashboard**: DAO performance metrics
- **Mobile Optimization**: Responsive design improvements

This enhanced governor dashboard provides a comprehensive solution for DAO management with proper enum parsing, role-based access control, and real-time blockchain integration. 