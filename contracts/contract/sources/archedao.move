module DAOri::core {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use std::timestamp;
    use std::hash;
    use std::table::{Self, Table};
    use std::event;
    use std::bcs;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    // Admin address - the dao-admin profile address
    const ADMIN_ADDRESS: address = @0x692906717ffbfc458c597613e0dd42c8f18577d28c03d2fdb768a07aa0fee713;

    // Error constants
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_PROPOSAL: u64 = 2;
    const E_VOTING_ENDED: u64 = 3;
    const E_ALREADY_VOTED: u64 = 4;
    const E_INSUFFICIENT_BALANCE: u64 = 5;
    const E_DAO_NOT_FOUND: u64 = 6;
    const E_TASK_NOT_FOUND: u64 = 7;
    const E_ALREADY_DELEGATED: u64 = 8;
    const E_INVALID_DELEGATE: u64 = 9;
    const E_SUBSCRIPTION_REQUIRED: u64 = 10;
    const E_INVALID_AMOUNT: u64 = 11;
    const E_TASK_ALREADY_ASSIGNED: u64 = 12;
    const E_INVALID_SUBMISSION: u64 = 13;
    const E_NOT_TASK_CREATOR: u64 = 14;
    const E_INVALID_VALIDATION: u64 = 15;
    const E_PROPOSAL_NOT_FOUND: u64 = 16;
    const E_AIP_NOT_FOUND: u64 = 17;

    // Constants
    const PLATFORM_FEE_RATE: u64 = 250; // 2.5%
    const PREMIUM_SUBSCRIPTION_COST: u64 = 100000000; // 1 APT
    const DELEGATE_REGISTRATION_FEE: u64 = 50000000; // 0.5 APT
    const DAO_CREATION_FEE: u64 = 200000000; // 2 APT
    const TASK_CREATION_FEE: u64 = 10000000; // 0.1 APT
    const AI_DELEGATE_CREATION_FEE: u64 = 300000000; // 3 APT
    const PROPOSAL_CREATION_FEE: u64 = 20000000; // 0.2 APT

    // User types
    const USER_TYPE_MEMBER: u8 = 0;
    const USER_TYPE_DELEGATE: u8 = 1;
    const USER_TYPE_DAO_CREATOR: u8 = 2;
    const USER_TYPE_GOVERNOR: u8 = 3;

    // Proposal states
    const PROPOSAL_PENDING: u8 = 0;
    const PROPOSAL_ACTIVE: u8 = 1;
    const PROPOSAL_EXECUTED: u8 = 2;
    const PROPOSAL_CANCELLED: u8 = 3;
    const PROPOSAL_DEFEATED: u8 = 4;

    // Task states
    const TASK_OPEN: u8 = 0;
    const TASK_ASSIGNED: u8 = 1;
    const TASK_SUBMITTED: u8 = 2;
    const TASK_COMPLETED: u8 = 3;
    const TASK_CANCELLED: u8 = 4;

    // Vote options
    const VOTE_YES: u8 = 0;
    const VOTE_NO: u8 = 1;
    const VOTE_ABSTAIN: u8 = 2;

    // Structs
    struct UserProfile has key, store {
        address: address,
        user_type: u8,
        reputation_score: u64,
        contribution_score: u64,
        is_premium: bool,
        premium_expires: u64,
        governance_participation: u64,
        voting_power: u64,
        delegated_to: Option<address>,
        delegators: vector<address>,
        created_at: u64,
        notification_preferences: vector<u8>,
    }

    struct DAO has key, store {
        id: u64,
        dao_code: String,
        name: String,
        description: String,
        creator: address,
        governors: vector<address>,
        members: vector<address>,
        voting_power_distribution: Table<address, u64>,
        total_supply: u64,
        governance_token: String,
        minimum_proposal_threshold: u64,
        voting_period: u64,
        execution_delay: u64,
        proposal_count: u64,
        task_count: u64,
        treasury_balance: u64,
        is_active: bool,
        created_at: u64,
        settings: DAOSettings,
    }

    struct DAOSettings has store, drop, copy {
        proposal_creation_fee: u64,
        task_creation_fee: u64,
        minimum_voting_power: u64,
        delegation_enabled: bool,
        ai_delegates_enabled: bool,
        public_membership: bool,
        require_verification: bool,
    }

    struct Proposal has key, store {
        id: u64,
        dao_id: u64,
        title: String,
        description: String,
        proposer: address,
        start_time: u64,
        end_time: u64,
        execution_time: u64,
        yes_votes: u64,
        no_votes: u64,
        abstain_votes: u64,
        total_votes: u64,
        state: u8,
        voters: Table<address, u8>,
        execution_payload: vector<u8>,
        linked_aip: Option<u64>,
        execution_hash: Option<vector<u8>>,
        created_at: u64,
    }

    struct Task has key, store {
        id: u64,
        dao_id: u64,
        title: String,
        description: String,
        creator: address,
        assignee: Option<address>,
        bounty_amount: u64,
        required_skills: vector<String>,
        deadline: u64,
        state: u8,
        submission_hash: Option<vector<u8>>,
        validators: vector<address>,
        validation_results: Table<address, bool>,
        completion_proof: Option<String>,
        created_at: u64,
    }

    struct Delegate has key, store {
        address: address,
        name: String,
        description: String,
        philosophy: String,
        voting_power: u64,
        delegators: vector<address>,
        voting_history: vector<u64>, // proposal IDs
        performance_metrics: DelegateMetrics,
        communication_channels: vector<String>,
        verification_status: bool,
        registration_fee_paid: bool,
        created_at: u64,
    }

    struct DelegateMetrics has store {
        total_proposals_voted: u64,
        participation_rate: u64,
        alignment_score: u64,
        reputation_score: u64,
        response_time: u64,
    }

    struct AIDelegate has key, store {
        id: u64,
        owner: address,
        name: String,
        preferences: vector<u8>,
        risk_tolerance: u8,
        voting_power: u64,
        delegators: vector<address>,
        voting_history: vector<u64>,
        performance_metrics: AIDelegateMetrics,
        training_data: vector<u8>,
        model_version: u64,
        is_active: bool,
        created_at: u64,
    }

    struct AIDelegateMetrics has store {
        accuracy_score: u64,
        consistency_score: u64,
        alignment_score: u64,
        override_rate: u64,
        learning_progress: u64,
    }

    struct AIP has key, store {
        id: u64,
        title: String,
        description: String,
        author: address,
        category: String,
        status: String,
        implementation_status: String,
        linked_proposals: vector<u64>,
        discussion_count: u64,
        github_link: Option<String>,
        created_at: u64,
        updated_at: u64,
    }

    struct PlatformStats has key {
        total_users: u64,
        total_daos: u64,
        total_proposals: u64,
        total_tasks: u64,
        total_delegates: u64,
        total_ai_delegates: u64,
        total_volume: u64,
        platform_revenue: u64,
        last_updated: u64,
    }

    struct DAORegistry has key {
        daos: Table<u64, DAO>,
        dao_by_code: Table<String, u64>,
        next_dao_id: u64,
    }

    struct ProposalRegistry has key {
        proposals: Table<u64, Proposal>,
        proposals_by_dao: Table<u64, vector<u64>>, // DAO ID -> Proposal IDs
        next_proposal_id: u64,
    }

    struct TaskRegistry has key {
        tasks: Table<u64, Task>,
        tasks_by_dao: Table<u64, vector<u64>>, // DAO ID -> Task IDs
        next_task_id: u64,
    }

    struct AIPRegistry has key {
        aips: Table<u64, AIP>,
        aips_by_author: Table<address, vector<u64>>, // Author -> AIP IDs
        next_aip_id: u64,
    }

    // Simplified DAO info for view functions (without Tables)
    struct DAOInfo has store, drop, copy {
        id: u64,
        dao_code: String,
        name: String,
        description: String,
        creator: address,
        governors: vector<address>,
        members: vector<address>,
        total_supply: u64,
        governance_token: String,
        minimum_proposal_threshold: u64,
        voting_period: u64,
        execution_delay: u64,
        proposal_count: u64,
        task_count: u64,
        treasury_balance: u64,
        is_active: bool,
        created_at: u64,
        member_count: u64,
        settings: DAOSettings,
    }

    // Simplified Proposal info for view functions
    struct ProposalInfo has store, drop, copy {
        id: u64,
        dao_id: u64,
        title: String,
        description: String,
        proposer: address,
        start_time: u64,
        end_time: u64,
        execution_time: u64,
        yes_votes: u64,
        no_votes: u64,
        abstain_votes: u64,
        total_votes: u64,
        state: u8,
        linked_aip: Option<u64>,
        created_at: u64,
        user_voted: bool,
        user_vote: Option<u8>,
    }

    // Simplified Task info for view functions
    struct TaskInfo has store, drop, copy {
        id: u64,
        dao_id: u64,
        title: String,
        description: String,
        creator: address,
        assignee: Option<address>,
        bounty_amount: u64,
        deadline: u64,
        state: u8,
        created_at: u64,
        user_is_creator: bool,
        user_is_assignee: bool,
    }

    // User membership details for a DAO
    struct UserDAOMembership has store, drop, copy {
        is_member: bool,
        voting_power: u64,
        is_governor: bool,
        is_creator: bool,
        join_date: u64,
    }

    // AIP info struct
    struct AIPInfo has store, drop, copy {
        id: u64,
        title: String,
        description: String,
        category: String,
        status: String,
        created_at: u64,
    }

    // DAO summary struct  
    struct DAOSummary has store, drop, copy {
        id: u64,
        dao_code: String,
        name: String,
        description: String,
        member_count: u64,
        is_active: bool,
    }

    // User AIP info struct
    struct UserAIPInfo has store, drop, copy {
        id: u64,
        title: String,
        description: String,
        category: String,
        status: String,
        implementation_status: String,
        created_at: u64,
        updated_at: u64,
    }

    // Complete DAO ecosystem data for a user
    struct CompleteDAOData has store, drop, copy {
        dao_info: DAOInfo,
        user_membership: UserDAOMembership,
        proposals: vector<ProposalInfo>,
        tasks: vector<TaskInfo>,
        user_proposals_created: u64,
        user_tasks_created: u64,
        user_votes_cast: u64,
        total_voting_power_used: u64,
        user_aip: Option<AIPInfo>, // AIP info if user has one
    }

    // Ultimate aggregated data for all DAOs a user has joined
    struct UserDAOEcosystem has store, drop, copy {
        user_address: address,
        total_daos_joined: u64,
        total_voting_power: u64,
        total_proposals_created: u64,
        total_tasks_created: u64,
        total_votes_cast: u64,
        daos: vector<CompleteDAOData>,
        generated_at: u64,
    }

    struct PlatformConfig has key {
        admin: address,
        platform_fee_rate: u64,
        premium_subscription_cost: u64,
        delegate_registration_fee: u64,
        dao_creation_fee: u64,
        task_creation_fee: u64,
        ai_delegate_creation_fee: u64,
        proposal_creation_fee: u64,
        treasury: address,
        is_paused: bool,
    }



    // Events
    #[event]
    struct UserRegistered has drop, store {
        user_address: address,
        user_type: u8,
        timestamp: u64,
    }

    #[event]
    struct DAOCreated has drop, store {
        dao_id: u64,
        dao_code: String,
        creator: address,
        name: String,
        timestamp: u64,
    }

    #[event]
    struct ProposalCreated has drop, store {
        proposal_id: u64,
        dao_id: u64,
        proposer: address,
        title: String,
        timestamp: u64,
    }

    #[event]
    struct VoteCasted has drop, store {
        proposal_id: u64,
        voter: address,
        vote: u8,
        voting_power: u64,
        timestamp: u64,
    }

    #[event]
    struct TaskCreated has drop, store {
        task_id: u64,
        dao_id: u64,
        creator: address,
        bounty_amount: u64,
        timestamp: u64,
    }

    #[event]
    struct DelegateRegistered has drop, store {
        delegate_address: address,
        name: String,
        timestamp: u64,
    }

    #[event]
    struct DelegationChanged has drop, store {
        delegator: address,
        old_delegate: Option<address>,
        new_delegate: Option<address>,
        timestamp: u64,
    }

    #[event]
    struct AIDelegateCreated has drop, store {
        ai_delegate_id: u64,
        owner: address,
        name: String,
        timestamp: u64,
    }

    #[event]
    struct PremiumSubscribed has drop, store {
        user: address,
        expires_at: u64,
        timestamp: u64,
    }

    #[event]
    struct PlatformFeeCollected has drop, store {
        amount: u64,
        source: String,
        timestamp: u64,
    }

    #[event]
    struct GovernorAdded has drop, store {
        dao_id: u64,
        new_governor: address,
        added_by: address,
        timestamp: u64,
    }

    #[event]
    struct GovernorPromoted has drop, store {
        dao_id: u64,
        member_address: address,
        promoted_by: address,
        timestamp: u64,
    }

    #[event]
    struct GovernorDemoted has drop, store {
        dao_id: u64,
        governor_address: address,
        demoted_by: address,
        timestamp: u64,
    }

    #[event]
    struct OwnershipTransferred has drop, store {
        dao_id: u64,
        old_owner: address,
        new_owner: address,
        timestamp: u64,
    }

    // Helper function to generate unique DAO code
    fun generate_dao_code(dao_id: u64, creator: address, timestamp: u64): String {
        let data = vector::empty<u8>();
        vector::append(&mut data, bcs::to_bytes(&dao_id));
        vector::append(&mut data, bcs::to_bytes(&creator));
        vector::append(&mut data, bcs::to_bytes(&timestamp));
        
        let hash_bytes = hash::sha3_256(data);
        
        // Convert first 8 bytes of hash to hex string for DAO code
        let code_bytes = vector::empty<u8>();
        let i = 0;
        while (i < 8 && i < vector::length(&hash_bytes)) {
            vector::push_back(&mut code_bytes, *vector::borrow(&hash_bytes, i));
            i = i + 1;
        };
        
        // Convert to uppercase hex string
        let hex_chars = b"0123456789ABCDEF";
        let result = vector::empty<u8>();
        let j = 0;
        while (j < vector::length(&code_bytes)) {
            let byte = *vector::borrow(&code_bytes, j);
            let high = (byte >> 4) & 0x0F;
            let low = byte & 0x0F;
            vector::push_back(&mut result, *vector::borrow(&hex_chars, (high as u64)));
            vector::push_back(&mut result, *vector::borrow(&hex_chars, (low as u64)));
            j = j + 1;
        };
        
        string::utf8(result)
    }

    // Initialize the platform
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);

        // Initialize platform config
        move_to(admin, PlatformConfig {
            admin: admin_addr,
            platform_fee_rate: PLATFORM_FEE_RATE,
            premium_subscription_cost: PREMIUM_SUBSCRIPTION_COST,
            delegate_registration_fee: DELEGATE_REGISTRATION_FEE,
            dao_creation_fee: DAO_CREATION_FEE,
            task_creation_fee: TASK_CREATION_FEE,
            ai_delegate_creation_fee: AI_DELEGATE_CREATION_FEE,
            proposal_creation_fee: PROPOSAL_CREATION_FEE,
            treasury: admin_addr, // Use admin address as treasury for now
            is_paused: false,
        });

        // Initialize platform stats
        move_to(admin, PlatformStats {
            total_users: 0,
            total_daos: 0,
            total_proposals: 0,
            total_tasks: 0,
            total_delegates: 0,
            total_ai_delegates: 0,
            total_volume: 0,
            platform_revenue: 0,
            last_updated: timestamp::now_seconds(),
        });

        // Initialize DAO registry
        move_to(admin, DAORegistry {
            daos: table::new(),
            dao_by_code: table::new(),
            next_dao_id: 1,
        });

        // Initialize Proposal registry
        move_to(admin, ProposalRegistry {
            proposals: table::new(),
            proposals_by_dao: table::new(),
            next_proposal_id: 1,
        });

        // Initialize Task registry
        move_to(admin, TaskRegistry {
            tasks: table::new(),
            tasks_by_dao: table::new(),
            next_task_id: 1,
        });

        // Initialize AIP registry
        move_to(admin, AIPRegistry {
            aips: table::new(),
            aips_by_author: table::new(),
            next_aip_id: 1,
        });
    }

    // User registration and profile management
    public entry fun register_user(
        user: &signer,
        user_type: u8,
        notification_preferences: vector<u8>
    ) acquires PlatformStats {
        let user_addr = signer::address_of(user);
        
        // Create user profile
        let profile = UserProfile {
            address: user_addr,
            user_type,
            reputation_score: 100,
            contribution_score: 0,
            is_premium: false,
            premium_expires: 0,
            governance_participation: 0,
            voting_power: 0,
            delegated_to: option::none(),
            delegators: vector::empty(),
            created_at: timestamp::now_seconds(),
            notification_preferences,
        };

        move_to(user, profile);

        // Update platform stats
        let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
        stats.total_users = stats.total_users + 1;
        stats.last_updated = timestamp::now_seconds();

        // Emit event
        event::emit(UserRegistered {
            user_address: user_addr,
            user_type,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Premium subscription
    public entry fun subscribe_premium(user: &signer) acquires UserProfile, PlatformConfig {
        let user_addr = signer::address_of(user);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Transfer subscription fee
        let payment = coin::withdraw<AptosCoin>(user, config.premium_subscription_cost);
        coin::deposit(config.treasury, payment);

        // Update user profile
        let profile = borrow_global_mut<UserProfile>(user_addr);
        profile.is_premium = true;
        profile.premium_expires = timestamp::now_seconds() + 31536000; // 1 year

        // Emit event
        event::emit(PremiumSubscribed {
            user: user_addr,
            expires_at: profile.premium_expires,
            timestamp: timestamp::now_seconds(),
        });

        // Emit fee collection event
        event::emit(PlatformFeeCollected {
            amount: config.premium_subscription_cost,
            source: string::utf8(b"premium_subscription"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // DAO creation
    public entry fun create_dao(
        creator: &signer,
        name: String,
        description: String,
        governance_token: String,
        minimum_proposal_threshold: u64,
        voting_period: u64,
        execution_delay: u64,
        initial_governors: vector<address>,
        proposal_creation_fee: u64,
        task_creation_fee: u64,
        minimum_voting_power: u64,
        delegation_enabled: bool,
        ai_delegates_enabled: bool,
        public_membership: bool,
        require_verification: bool
    ) acquires PlatformStats, PlatformConfig, DAORegistry, UserProfile {
        let creator_addr = signer::address_of(creator);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Charge DAO creation fee
        let payment = coin::withdraw<AptosCoin>(creator, config.dao_creation_fee);
        coin::deposit(config.treasury, payment);

        // Update user profile to DAO creator or create one if it doesn't exist
        if (exists<UserProfile>(creator_addr)) {
            let profile = borrow_global_mut<UserProfile>(creator_addr);
            profile.user_type = USER_TYPE_DAO_CREATOR;
            profile.reputation_score = profile.reputation_score + 50; // Bonus for creating DAO
        } else {
            // Create new profile for DAO creator
            let new_profile = UserProfile {
                address: creator_addr,
                user_type: USER_TYPE_DAO_CREATOR,
                reputation_score: 150, // Base 100 + 50 bonus for creating DAO
                contribution_score: 0,
                is_premium: false,
                premium_expires: 0,
                governance_participation: 0,
                voting_power: 0, // Will be updated below
                delegated_to: option::none(),
                delegators: vector::empty(),
                created_at: timestamp::now_seconds(),
                notification_preferences: vector::empty(),
            };
            move_to(creator, new_profile);
            
            // Update platform stats for new user
            let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
            stats.total_users = stats.total_users + 1;
            
            // Emit user registration event
            event::emit(UserRegistered {
                user_address: creator_addr,
                user_type: USER_TYPE_DAO_CREATOR,
                timestamp: timestamp::now_seconds(),
            });
        };

        // Get next DAO ID from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        let dao_id = registry.next_dao_id;
        let created_at = timestamp::now_seconds();

        // Generate unique DAO code
        let dao_code = generate_dao_code(dao_id, creator_addr, created_at);

        // Create DAO
        let settings = DAOSettings {
            proposal_creation_fee,
            task_creation_fee,
            minimum_voting_power,
            delegation_enabled,
            ai_delegates_enabled,
            public_membership,
            require_verification,
        };
        
        // Initialize members vector with creator
        let members = vector::empty<address>();
        vector::push_back(&mut members, creator_addr);
        
        // Initialize voting power distribution with creator
        let voting_power_distribution = table::new<address, u64>();
        table::add(&mut voting_power_distribution, creator_addr, 1000); // Creator gets 1000 voting power
        
        let dao = DAO {
            id: dao_id,
            dao_code,
            name,
            description,
            creator: creator_addr,
            governors: initial_governors,
            members,
            voting_power_distribution,
            total_supply: 1000,
            governance_token,
            minimum_proposal_threshold,
            voting_period,
            execution_delay,
            proposal_count: 0,
            task_count: 0,
            treasury_balance: 0,
            is_active: true,
            created_at,
            settings,
        };
        
        // Update creator's voting power in their profile (guaranteed to exist now)
        let profile = borrow_global_mut<UserProfile>(creator_addr);
        profile.voting_power = profile.voting_power + 1000;

        // Store DAO in central registry
        table::add(&mut registry.daos, dao_id, dao);
        table::add(&mut registry.dao_by_code, dao_code, dao_id);
        registry.next_dao_id = dao_id + 1;

        // Update platform stats
        let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
        stats.total_daos = stats.total_daos + 1;
        stats.platform_revenue = stats.platform_revenue + config.dao_creation_fee;
        stats.last_updated = timestamp::now_seconds();

        // Emit events
        event::emit(DAOCreated {
            dao_id,
            dao_code,
            creator: creator_addr,
            name,
            timestamp: created_at,
        });

        event::emit(PlatformFeeCollected {
            amount: config.dao_creation_fee,
            source: string::utf8(b"dao_creation"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // Proposal creation
    public entry fun create_proposal(
        proposer: &signer,
        dao_id: u64,
        title: String,
        description: String,
        execution_payload: vector<u8>,
        linked_aip: Option<u64>
    ) acquires DAORegistry, ProposalRegistry, PlatformStats, PlatformConfig {
        let proposer_addr = signer::address_of(proposer);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Charge proposal creation fee
        let payment = coin::withdraw<AptosCoin>(proposer, config.proposal_creation_fee);
        coin::deposit(config.treasury, payment);

        // Get DAO from registry and update proposal count
        let dao_registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&dao_registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut dao_registry.daos, dao_id);
        dao.proposal_count = dao.proposal_count + 1;

        // Get next proposal ID from proposal registry
        let proposal_registry = borrow_global_mut<ProposalRegistry>(ADMIN_ADDRESS);
        let proposal_id = proposal_registry.next_proposal_id;

        // Create proposal
        let proposal = Proposal {
            id: proposal_id,
            dao_id,
            title,
            description,
            proposer: proposer_addr,
            start_time: timestamp::now_seconds(),
            end_time: timestamp::now_seconds() + dao.voting_period,
            execution_time: timestamp::now_seconds() + dao.voting_period + dao.execution_delay,
            yes_votes: 0,
            no_votes: 0,
            abstain_votes: 0,
            total_votes: 0,
            state: PROPOSAL_ACTIVE,
            voters: table::new(),
            execution_payload,
            linked_aip,
            execution_hash: option::none(),
            created_at: timestamp::now_seconds(),
        };

        // Store proposal in central registry
        table::add(&mut proposal_registry.proposals, proposal_id, proposal);
        
        // Add to DAO's proposal list
        if (!table::contains(&proposal_registry.proposals_by_dao, dao_id)) {
            table::add(&mut proposal_registry.proposals_by_dao, dao_id, vector::empty());
        };
        let dao_proposals = table::borrow_mut(&mut proposal_registry.proposals_by_dao, dao_id);
        vector::push_back(dao_proposals, proposal_id);
        
        // Update proposal registry
        proposal_registry.next_proposal_id = proposal_id + 1;

        // Update platform stats
        let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
        stats.total_proposals = stats.total_proposals + 1;
        stats.platform_revenue = stats.platform_revenue + config.proposal_creation_fee;
        stats.last_updated = timestamp::now_seconds();

        // Emit events
        event::emit(ProposalCreated {
            proposal_id,
            dao_id,
            proposer: proposer_addr,
            title,
            timestamp: timestamp::now_seconds(),
        });

        event::emit(PlatformFeeCollected {
            amount: config.proposal_creation_fee,
            source: string::utf8(b"proposal_creation"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // Voting function
    public entry fun vote(
        voter: &signer,
        proposal_id: u64,
        vote: u8
    ) acquires ProposalRegistry, UserProfile {
        let voter_addr = signer::address_of(voter);
        
        // Get proposal from registry
        let proposal_registry = borrow_global_mut<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut proposal_registry.proposals, proposal_id);
        
        // Verify proposal is active
        assert!(proposal.state == PROPOSAL_ACTIVE, E_VOTING_ENDED);
        assert!(timestamp::now_seconds() <= proposal.end_time, E_VOTING_ENDED);
        
        // Verify user hasn't already voted
        assert!(!table::contains(&proposal.voters, voter_addr), E_ALREADY_VOTED);

        // Get user's voting power
        let profile = borrow_global<UserProfile>(voter_addr);
        let voting_power = profile.voting_power;

        // Record vote
        table::add(&mut proposal.voters, voter_addr, vote);
        
        // Update vote counts
        if (vote == VOTE_YES) {
            proposal.yes_votes = proposal.yes_votes + voting_power;
        } else if (vote == VOTE_NO) {
            proposal.no_votes = proposal.no_votes + voting_power;
        } else {
            proposal.abstain_votes = proposal.abstain_votes + voting_power;
        };

        proposal.total_votes = proposal.total_votes + voting_power;

        // Emit event
        event::emit(VoteCasted {
            proposal_id,
            voter: voter_addr,
            vote,
            voting_power,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Task creation
    public entry fun create_task(
        creator: &signer,
        dao_id: u64,
        title: String,
        description: String,
        bounty_amount: u64,
        required_skills: vector<String>,
        deadline: u64
    ) acquires DAORegistry, TaskRegistry, PlatformStats, PlatformConfig {
        let creator_addr = signer::address_of(creator);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Charge task creation fee
        let payment = coin::withdraw<AptosCoin>(creator, config.task_creation_fee);
        coin::deposit(config.treasury, payment);

        // Get DAO from registry and update task count
        let dao_registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&dao_registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut dao_registry.daos, dao_id);
        dao.task_count = dao.task_count + 1;

        // Get next task ID from task registry
        let task_registry = borrow_global_mut<TaskRegistry>(ADMIN_ADDRESS);
        let task_id = task_registry.next_task_id;

        // Create task
        let task = Task {
            id: task_id,
            dao_id,
            title,
            description,
            creator: creator_addr,
            assignee: option::none(),
            bounty_amount,
            required_skills,
            deadline,
            state: TASK_OPEN,
            submission_hash: option::none(),
            validators: vector::empty(),
            validation_results: table::new(),
            completion_proof: option::none(),
            created_at: timestamp::now_seconds(),
        };

        // Store task in central registry
        table::add(&mut task_registry.tasks, task_id, task);
        
        // Add to DAO's task list
        if (!table::contains(&task_registry.tasks_by_dao, dao_id)) {
            table::add(&mut task_registry.tasks_by_dao, dao_id, vector::empty());
        };
        let dao_tasks = table::borrow_mut(&mut task_registry.tasks_by_dao, dao_id);
        vector::push_back(dao_tasks, task_id);
        
        // Update task registry
        task_registry.next_task_id = task_id + 1;

        // Update platform stats
        let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
        stats.total_tasks = stats.total_tasks + 1;
        stats.platform_revenue = stats.platform_revenue + config.task_creation_fee;
        stats.last_updated = timestamp::now_seconds();

        // Emit events
        event::emit(TaskCreated {
            task_id,
            dao_id,
            creator: creator_addr,
            bounty_amount,
            timestamp: timestamp::now_seconds(),
        });

        event::emit(PlatformFeeCollected {
            amount: config.task_creation_fee,
            source: string::utf8(b"task_creation"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // Delegate registration
    public entry fun register_delegate(
        delegate: &signer,
        name: String,
        description: String,
        philosophy: String,
        communication_channels: vector<String>
    ) acquires PlatformStats, PlatformConfig {
        let delegate_addr = signer::address_of(delegate);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Charge delegate registration fee
        let payment = coin::withdraw<AptosCoin>(delegate, config.delegate_registration_fee);
        coin::deposit(config.treasury, payment);

        // Create delegate profile
        let delegate_profile = Delegate {
            address: delegate_addr,
            name,
            description,
            philosophy,
            voting_power: 0,
            delegators: vector::empty(),
            voting_history: vector::empty(),
            performance_metrics: DelegateMetrics {
                total_proposals_voted: 0,
                participation_rate: 0,
                alignment_score: 100,
                reputation_score: 100,
                response_time: 0,
            },
            communication_channels,
            verification_status: false,
            registration_fee_paid: true,
            created_at: timestamp::now_seconds(),
        };

        move_to(delegate, delegate_profile);

        // Update platform stats
        let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
        stats.total_delegates = stats.total_delegates + 1;
        stats.platform_revenue = stats.platform_revenue + config.delegate_registration_fee;
        stats.last_updated = timestamp::now_seconds();

        // Emit events
        event::emit(DelegateRegistered {
            delegate_address: delegate_addr,
            name,
            timestamp: timestamp::now_seconds(),
        });

        event::emit(PlatformFeeCollected {
            amount: config.delegate_registration_fee,
            source: string::utf8(b"delegate_registration"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // Delegation functions
    public entry fun delegate_voting_power(
        delegator: &signer,
        delegate_address: address
    ) acquires UserProfile, Delegate {
        let delegator_addr = signer::address_of(delegator);
        
        // Update delegator profile
        let profile = borrow_global_mut<UserProfile>(delegator_addr);
        let old_delegate = profile.delegated_to;
        profile.delegated_to = option::some(delegate_address);

        // Update delegate's voting power and delegators list
        let delegate = borrow_global_mut<Delegate>(delegate_address);
        delegate.voting_power = delegate.voting_power + profile.voting_power;
        vector::push_back(&mut delegate.delegators, delegator_addr);

        // Remove from old delegate if exists
        if (option::is_some(&old_delegate)) {
            let old_delegate_addr = option::extract(&mut old_delegate);
            let old_delegate_profile = borrow_global_mut<Delegate>(old_delegate_addr);
            old_delegate_profile.voting_power = old_delegate_profile.voting_power - profile.voting_power;
            let (found, index) = vector::index_of(&old_delegate_profile.delegators, &delegator_addr);
            if (found) {
                vector::remove(&mut old_delegate_profile.delegators, index);
            };
        };

        // Emit event
        event::emit(DelegationChanged {
            delegator: delegator_addr,
            old_delegate,
            new_delegate: option::some(delegate_address),
            timestamp: timestamp::now_seconds(),
        });
    }

    // AI Delegate creation
    public entry fun create_ai_delegate(
        owner: &signer,
        name: String,
        preferences: vector<u8>,
        risk_tolerance: u8,
        training_data: vector<u8>
    ) acquires PlatformStats, PlatformConfig {
        let owner_addr = signer::address_of(owner);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Charge AI delegate creation fee
        let payment = coin::withdraw<AptosCoin>(owner, config.ai_delegate_creation_fee);
        coin::deposit(config.treasury, payment);

        // Get next AI delegate ID
        let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
        let ai_delegate_id = stats.total_ai_delegates + 1;

        // Create AI delegate
        let ai_delegate = AIDelegate {
            id: ai_delegate_id,
            owner: owner_addr,
            name,
            preferences,
            risk_tolerance,
            voting_power: 0,
            delegators: vector::empty(),
            voting_history: vector::empty(),
            performance_metrics: AIDelegateMetrics {
                accuracy_score: 100,
                consistency_score: 100,
                alignment_score: 100,
                override_rate: 0,
                learning_progress: 0,
            },
            training_data,
            model_version: 1,
            is_active: true,
            created_at: timestamp::now_seconds(),
        };

        move_to(owner, ai_delegate);

        // Update platform stats
        stats.total_ai_delegates = stats.total_ai_delegates + 1;
        stats.platform_revenue = stats.platform_revenue + config.ai_delegate_creation_fee;
        stats.last_updated = timestamp::now_seconds();

        // Emit events
        event::emit(AIDelegateCreated {
            ai_delegate_id,
            owner: owner_addr,
            name,
            timestamp: timestamp::now_seconds(),
        });

        event::emit(PlatformFeeCollected {
            amount: config.ai_delegate_creation_fee,
            source: string::utf8(b"ai_delegate_creation"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // Task assignment
    public entry fun assign_task(
        assignee: &signer,
        task_id: u64
    ) acquires TaskRegistry {
        let assignee_addr = signer::address_of(assignee);
        
        // Get task from registry
        let task_registry = borrow_global_mut<TaskRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&task_registry.tasks, task_id), E_TASK_NOT_FOUND);
        let task = table::borrow_mut(&mut task_registry.tasks, task_id);
        
        // Verify task is open
        assert!(task.state == TASK_OPEN, E_TASK_ALREADY_ASSIGNED);
        
        // Assign task
        task.assignee = option::some(assignee_addr);
        task.state = TASK_ASSIGNED;
    }

    // Task submission
    public entry fun submit_task(
        assignee: &signer,
        task_id: u64,
        submission_hash: vector<u8>,
        completion_proof: String
    ) acquires TaskRegistry {
        let assignee_addr = signer::address_of(assignee);
        
        // Get task from registry
        let task_registry = borrow_global_mut<TaskRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&task_registry.tasks, task_id), E_TASK_NOT_FOUND);
        let task = table::borrow_mut(&mut task_registry.tasks, task_id);
        
        // Verify task is assigned to this user
        assert!(option::contains(&task.assignee, &assignee_addr), E_NOT_AUTHORIZED);
        assert!(task.state == TASK_ASSIGNED, E_INVALID_SUBMISSION);
        
        // Submit task
        task.submission_hash = option::some(submission_hash);
        task.completion_proof = option::some(completion_proof);
        task.state = TASK_SUBMITTED;
    }

    // Task validation
    public entry fun validate_task(
        validator: &signer,
        task_id: u64,
        is_valid: bool
    ) acquires TaskRegistry {
        let validator_addr = signer::address_of(validator);
        
        // Get task from registry
        let task_registry = borrow_global_mut<TaskRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&task_registry.tasks, task_id), E_TASK_NOT_FOUND);
        let task = table::borrow_mut(&mut task_registry.tasks, task_id);
        
        // Verify task is submitted
        assert!(task.state == TASK_SUBMITTED, E_INVALID_VALIDATION);
        
        // Add validation
        table::add(&mut task.validation_results, validator_addr, is_valid);
        vector::push_back(&mut task.validators, validator_addr);
        
        // Check if task should be completed (simple majority)
        let total_validators = vector::length(&task.validators);
        let valid_count = 0;
        let i = 0;
        while (i < total_validators) {
            let validator = vector::borrow(&task.validators, i);
            if (*table::borrow(&task.validation_results, *validator)) {
                valid_count = valid_count + 1;
            };
            i = i + 1;
        };
        
        // If majority validates, complete task
        if (valid_count > total_validators / 2) {
            task.state = TASK_COMPLETED;
        };
    }

    // Task bounty distribution
    public entry fun distribute_bounty(
        task_creator: &signer,
        task_id: u64
    ) acquires TaskRegistry, PlatformConfig {
        let creator_addr = signer::address_of(task_creator);
        
        // Get task from registry
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&task_registry.tasks, task_id), E_TASK_NOT_FOUND);
        let task = table::borrow(&task_registry.tasks, task_id);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify task is completed and creator is authorized
        assert!(task.state == TASK_COMPLETED, E_INVALID_VALIDATION);
        assert!(task.creator == creator_addr, E_NOT_TASK_CREATOR);
        
        // Calculate platform fee
        let platform_fee = (task.bounty_amount * config.platform_fee_rate) / 10000;
        let assignee_amount = task.bounty_amount - platform_fee;
        
        // Distribute bounty
        if (option::is_some(&task.assignee)) {
            let assignee_addr = option::extract(&mut option::some(*option::borrow(&task.assignee)));
            let assignee_payment = coin::withdraw<AptosCoin>(task_creator, assignee_amount);
            coin::deposit(assignee_addr, assignee_payment);
        };
        
        // Collect platform fee
        let platform_payment = coin::withdraw<AptosCoin>(task_creator, platform_fee);
        coin::deposit(config.treasury, platform_payment);
        
        // Emit fee collection event
        event::emit(PlatformFeeCollected {
            amount: platform_fee,
            source: string::utf8(b"task_bounty"),
            timestamp: timestamp::now_seconds(),
        });
    }

    // AIP creation
    public entry fun create_aip(
        author: &signer,
        title: String,
        description: String,
        category: String,
        github_link: Option<String>
    ) acquires AIPRegistry {
        let author_addr = signer::address_of(author);
        
        // Get next AIP ID from registry
        let aip_registry = borrow_global_mut<AIPRegistry>(ADMIN_ADDRESS);
        let aip_id = aip_registry.next_aip_id;
        
        let aip = AIP {
            id: aip_id,
            title,
            description,
            author: author_addr,
            category,
            status: string::utf8(b"Draft"),
            implementation_status: string::utf8(b"Not Started"),
            linked_proposals: vector::empty(),
            discussion_count: 0,
            github_link,
            created_at: timestamp::now_seconds(),
            updated_at: timestamp::now_seconds(),
        };
        
        // Store AIP in central registry
        table::add(&mut aip_registry.aips, aip_id, aip);
        
        // Add to author's AIP list
        if (!table::contains(&aip_registry.aips_by_author, author_addr)) {
            table::add(&mut aip_registry.aips_by_author, author_addr, vector::empty());
        };
        let author_aips = table::borrow_mut(&mut aip_registry.aips_by_author, author_addr);
        vector::push_back(author_aips, aip_id);
        
        // Update AIP registry
        aip_registry.next_aip_id = aip_id + 1;
    }

    // Update AIP status
    public entry fun update_aip_status(
        author: &signer,
        aip_id: u64,
        status: String,
        implementation_status: String
    ) acquires AIPRegistry {
        let author_addr = signer::address_of(author);
        
        // Get AIP from registry
        let aip_registry = borrow_global_mut<AIPRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&aip_registry.aips, aip_id), E_AIP_NOT_FOUND);
        let aip = table::borrow_mut(&mut aip_registry.aips, aip_id);
        
        // Verify author
        assert!(aip.author == author_addr, E_NOT_AUTHORIZED);
        
        // Update status
        aip.status = status;
        aip.implementation_status = implementation_status;
        aip.updated_at = timestamp::now_seconds();
    }

    // Link AIP to proposal
    public entry fun link_aip_to_proposal(
        aip_author: &signer,
        aip_id: u64,
        proposal_id: u64
    ) acquires AIPRegistry {
        let author_addr = signer::address_of(aip_author);
        
        // Get AIP from registry
        let aip_registry = borrow_global_mut<AIPRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&aip_registry.aips, aip_id), E_AIP_NOT_FOUND);
        let aip = table::borrow_mut(&mut aip_registry.aips, aip_id);
        
        // Verify author
        assert!(aip.author == author_addr, E_NOT_AUTHORIZED);
        
        // Link proposal
        vector::push_back(&mut aip.linked_proposals, proposal_id);
        aip.updated_at = timestamp::now_seconds();
    }

    // Update user reputation
    public entry fun update_reputation(
        admin: &signer,
        user_address: address,
        reputation_delta: u64,
        contribution_delta: u64
    ) acquires UserProfile, PlatformConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify admin
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);
        
        // Update user profile
        let profile = borrow_global_mut<UserProfile>(user_address);
        profile.reputation_score = profile.reputation_score + reputation_delta;
        profile.contribution_score = profile.contribution_score + contribution_delta;
    }

    // DAO membership functions
    public entry fun join_dao_by_id(
        user: &signer,
        dao_id: u64
    ) acquires DAORegistry, UserProfile, PlatformStats {
        let user_addr = signer::address_of(user);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify DAO allows public membership
        assert!(dao.settings.public_membership, E_NOT_AUTHORIZED);
        
        // Create user profile if it doesn't exist, or update existing one
        if (exists<UserProfile>(user_addr)) {
            let profile = borrow_global_mut<UserProfile>(user_addr);
            // Update to member type if they're not already a higher type
            if (profile.user_type == USER_TYPE_MEMBER) {
                profile.user_type = USER_TYPE_MEMBER;
            };
        } else {
            // Create new profile for member
            let new_profile = UserProfile {
                address: user_addr,
                user_type: USER_TYPE_MEMBER,
                reputation_score: 100,
                contribution_score: 0,
                is_premium: false,
                premium_expires: 0,
                governance_participation: 0,
                voting_power: 0, // Will be updated below
                delegated_to: option::none(),
                delegators: vector::empty(),
                created_at: timestamp::now_seconds(),
                notification_preferences: vector::empty(),
            };
            move_to(user, new_profile);
            
            // Update platform stats for new user
            let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
            stats.total_users = stats.total_users + 1;
            
            // Emit user registration event
            event::emit(UserRegistered {
                user_address: user_addr,
                user_type: USER_TYPE_MEMBER,
                timestamp: timestamp::now_seconds(),
            });
        };
        
        // Add user to DAO members
        if (!vector::contains(&dao.members, &user_addr)) {
            vector::push_back(&mut dao.members, user_addr);
        };
        
        // Initialize voting power
        table::add(&mut dao.voting_power_distribution, user_addr, 100); // Base voting power
        dao.total_supply = dao.total_supply + 100;
        
        // Update user profile voting power (guaranteed to exist now)
        let profile = borrow_global_mut<UserProfile>(user_addr);
        profile.voting_power = profile.voting_power + 100;
    }

    // Join DAO using DAO code (now much simpler!)
    public entry fun join_dao_by_code(
        user: &signer,
        dao_code: String
    ) acquires DAORegistry, UserProfile, PlatformStats {
        let user_addr = signer::address_of(user);
        
        // Get DAO ID from registry using the code
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.dao_by_code, dao_code), E_DAO_NOT_FOUND);
        let dao_id = *table::borrow(&registry.dao_by_code, dao_code);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify DAO allows public membership
        assert!(dao.settings.public_membership, E_NOT_AUTHORIZED);
        
        // Create user profile if it doesn't exist, or update existing one
        if (exists<UserProfile>(user_addr)) {
            let profile = borrow_global_mut<UserProfile>(user_addr);
            // Update to member type if they're not already a higher type
            if (profile.user_type == USER_TYPE_MEMBER) {
                profile.user_type = USER_TYPE_MEMBER;
            };
        } else {
            // Create new profile for member
            let new_profile = UserProfile {
                address: user_addr,
                user_type: USER_TYPE_MEMBER,
                reputation_score: 100,
                contribution_score: 0,
                is_premium: false,
                premium_expires: 0,
                governance_participation: 0,
                voting_power: 0, // Will be updated below
                delegated_to: option::none(),
                delegators: vector::empty(),
                created_at: timestamp::now_seconds(),
                notification_preferences: vector::empty(),
            };
            move_to(user, new_profile);
            
            // Update platform stats for new user
            let stats = borrow_global_mut<PlatformStats>(ADMIN_ADDRESS);
            stats.total_users = stats.total_users + 1;
            
            // Emit user registration event
            event::emit(UserRegistered {
                user_address: user_addr,
                user_type: USER_TYPE_MEMBER,
                timestamp: timestamp::now_seconds(),
            });
        };
        
        // Add user to DAO members
        if (!vector::contains(&dao.members, &user_addr)) {
            vector::push_back(&mut dao.members, user_addr);
        };
        
        // Initialize voting power
        table::add(&mut dao.voting_power_distribution, user_addr, 100); // Base voting power
        dao.total_supply = dao.total_supply + 100;
        
        // Update user profile voting power (guaranteed to exist now)
        let profile = borrow_global_mut<UserProfile>(user_addr);
        profile.voting_power = profile.voting_power + 100;
    }



    // Withdraw from DAO
    public entry fun leave_dao(
        user: &signer,
        dao_id: u64
    ) acquires DAORegistry, UserProfile {
        let user_addr = signer::address_of(user);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Remove user from DAO members
        let (found, index) = vector::index_of(&dao.members, &user_addr);
        if (found) {
            vector::remove(&mut dao.members, index);
        };
        
        // Remove voting power
        if (table::contains(&dao.voting_power_distribution, user_addr)) {
            let voting_power = table::remove(&mut dao.voting_power_distribution, user_addr);
            dao.total_supply = dao.total_supply - voting_power;
            
            // Update user profile
            let profile = borrow_global_mut<UserProfile>(user_addr);
            profile.voting_power = profile.voting_power - voting_power;
        };
    }

    // Execute proposal
    public entry fun execute_proposal(
        executor: &signer,
        proposal_id: u64
    ) acquires ProposalRegistry, DAORegistry {
        let executor_addr = signer::address_of(executor);
        
        // Get proposal from registry
        let proposal_registry = borrow_global_mut<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut proposal_registry.proposals, proposal_id);
        
        // Get DAO from registry to check permissions
        let dao_registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&dao_registry.daos, proposal.dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&dao_registry.daos, proposal.dao_id);
        
        // Verify executor is authorized (DAO creator or governor)
        assert!(
            dao.creator == executor_addr || vector::contains(&dao.governors, &executor_addr),
            E_NOT_AUTHORIZED
        );
        
        // Verify proposal can be executed
        assert!(proposal.state == PROPOSAL_ACTIVE, E_INVALID_PROPOSAL);
        assert!(timestamp::now_seconds() >= proposal.execution_time, E_INVALID_PROPOSAL);
        assert!(proposal.yes_votes > proposal.no_votes, E_INVALID_PROPOSAL);
        
        // Execute proposal
        proposal.state = PROPOSAL_EXECUTED;
        
        // Generate execution hash
        let execution_data = vector::empty<u8>();
        vector::append(&mut execution_data, proposal.execution_payload);
        vector::append(&mut execution_data, bcs::to_bytes(&timestamp::now_seconds()));
        proposal.execution_hash = option::some(hash::sha3_256(execution_data));
    }

    // Cancel proposal
    public entry fun cancel_proposal(
        proposer: &signer,
        proposal_id: u64
    ) acquires ProposalRegistry {
        let proposer_addr = signer::address_of(proposer);
        
        // Get proposal from registry
        let proposal_registry = borrow_global_mut<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut proposal_registry.proposals, proposal_id);
        
        // Verify proposer
        assert!(proposal.proposer == proposer_addr, E_NOT_AUTHORIZED);
        assert!(proposal.state == PROPOSAL_ACTIVE, E_INVALID_PROPOSAL);
        
        // Cancel proposal
        proposal.state = PROPOSAL_CANCELLED;
    }

    // Update DAO settings
    public entry fun update_dao_settings(
        governor: &signer,
        dao_id: u64,
        proposal_creation_fee: u64,
        task_creation_fee: u64,
        minimum_voting_power: u64,
        delegation_enabled: bool,
        ai_delegates_enabled: bool,
        public_membership: bool,
        require_verification: bool
    ) acquires DAORegistry {
        let governor_addr = signer::address_of(governor);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify governor
        assert!(vector::contains(&dao.governors, &governor_addr), E_NOT_AUTHORIZED);
        
        // Update settings
        let new_settings = DAOSettings {
            proposal_creation_fee,
            task_creation_fee,
            minimum_voting_power,
            delegation_enabled,
            ai_delegates_enabled,
            public_membership,
            require_verification,
        };
        dao.settings = new_settings;
    }

    // Add governor (only DAO owner can do this)
    public entry fun add_governor(
        owner: &signer,
        dao_id: u64,
        new_governor: address
    ) acquires DAORegistry, UserProfile {
        let owner_addr = signer::address_of(owner);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify owner
        assert!(dao.creator == owner_addr, E_NOT_AUTHORIZED);
        
        // Verify new governor is a member of the DAO
        assert!(vector::contains(&dao.members, &new_governor), E_NOT_AUTHORIZED);
        
        // Add to governors if not already there
        if (!vector::contains(&dao.governors, &new_governor)) {
            vector::push_back(&mut dao.governors, new_governor);
        };
        
        // Update user profile to governor type
        if (exists<UserProfile>(new_governor)) {
            let profile = borrow_global_mut<UserProfile>(new_governor);
            profile.user_type = USER_TYPE_GOVERNOR;
        };

        // Emit event
        event::emit(GovernorAdded {
            dao_id,
            new_governor,
            added_by: owner_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Promote member to governor (only DAO owner can do this)
    public entry fun promote_to_governor(
        owner: &signer,
        dao_id: u64,
        member_address: address
    ) acquires DAORegistry, UserProfile {
        let owner_addr = signer::address_of(owner);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify owner
        assert!(dao.creator == owner_addr, E_NOT_AUTHORIZED);
        
        // Verify member is part of the DAO
        assert!(vector::contains(&dao.members, &member_address), E_NOT_AUTHORIZED);
        
        // Add to governors if not already there
        if (!vector::contains(&dao.governors, &member_address)) {
            vector::push_back(&mut dao.governors, member_address);
        };
        
        // Update user profile to governor type
        if (exists<UserProfile>(member_address)) {
            let profile = borrow_global_mut<UserProfile>(member_address);
            profile.user_type = USER_TYPE_GOVERNOR;
            profile.reputation_score = profile.reputation_score + 25; // Bonus for promotion
        };

        // Emit event
        event::emit(GovernorPromoted {
            dao_id,
            member_address,
            promoted_by: owner_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Demote governor to member (only DAO owner can do this)
    public entry fun demote_governor(
        owner: &signer,
        dao_id: u64,
        governor_address: address
    ) acquires DAORegistry, UserProfile {
        let owner_addr = signer::address_of(owner);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify owner
        assert!(dao.creator == owner_addr, E_NOT_AUTHORIZED);
        
        // Cannot demote the owner themselves
        assert!(governor_address != owner_addr, E_NOT_AUTHORIZED);
        
        // Remove from governors
        let (found, index) = vector::index_of(&dao.governors, &governor_address);
        if (found) {
            vector::remove(&mut dao.governors, index);
        };
        
        // Update user profile to member type
        if (exists<UserProfile>(governor_address)) {
            let profile = borrow_global_mut<UserProfile>(governor_address);
            profile.user_type = USER_TYPE_MEMBER;
        };

        // Emit event
        event::emit(GovernorDemoted {
            dao_id,
            governor_address,
            demoted_by: owner_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Transfer DAO ownership (only current owner can do this)
    public entry fun transfer_dao_ownership(
        current_owner: &signer,
        dao_id: u64,
        new_owner: address
    ) acquires DAORegistry, UserProfile {
        let current_owner_addr = signer::address_of(current_owner);
        
        // Get DAO from registry
        let registry = borrow_global_mut<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow_mut(&mut registry.daos, dao_id);
        
        // Verify current owner
        assert!(dao.creator == current_owner_addr, E_NOT_AUTHORIZED);
        
        // Verify new owner is a member of the DAO
        assert!(vector::contains(&dao.members, &new_owner), E_NOT_AUTHORIZED);
        
        // Transfer ownership
        dao.creator = new_owner;
        
        // Add new owner to governors if not already there
        if (!vector::contains(&dao.governors, &new_owner)) {
            vector::push_back(&mut dao.governors, new_owner);
        };
        
        // Update new owner's profile to DAO creator type
        if (exists<UserProfile>(new_owner)) {
            let profile = borrow_global_mut<UserProfile>(new_owner);
            profile.user_type = USER_TYPE_DAO_CREATOR;
            profile.reputation_score = profile.reputation_score + 100; // Bonus for ownership
        };
        
        // Update old owner's profile to governor type (they remain a governor)
        if (exists<UserProfile>(current_owner_addr)) {
            let profile = borrow_global_mut<UserProfile>(current_owner_addr);
            profile.user_type = USER_TYPE_GOVERNOR;
        };

        // Emit event
        event::emit(OwnershipTransferred {
            dao_id,
            old_owner: current_owner_addr,
            new_owner,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Delegate vote on behalf of delegators
    public entry fun delegate_vote(
        delegate: &signer,
        proposal_id: u64,
        vote: u8
    ) acquires Delegate, ProposalRegistry {
        let delegate_addr = signer::address_of(delegate);
        let delegate_profile = borrow_global_mut<Delegate>(delegate_addr);
        
        // Get proposal from registry
        let proposal_registry = borrow_global_mut<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut proposal_registry.proposals, proposal_id);
        
        // Verify proposal is active
        assert!(proposal.state == PROPOSAL_ACTIVE, E_VOTING_ENDED);
        assert!(timestamp::now_seconds() <= proposal.end_time, E_VOTING_ENDED);
        
        // Verify delegate hasn't already voted
        assert!(!table::contains(&proposal.voters, delegate_addr), E_ALREADY_VOTED);
        
        // Cast vote with delegate's voting power
        table::add(&mut proposal.voters, delegate_addr, vote);
        
        // Update vote counts
        if (vote == VOTE_YES) {
            proposal.yes_votes = proposal.yes_votes + delegate_profile.voting_power;
        } else if (vote == VOTE_NO) {
            proposal.no_votes = proposal.no_votes + delegate_profile.voting_power;
        } else {
            proposal.abstain_votes = proposal.abstain_votes + delegate_profile.voting_power;
        };
        
        proposal.total_votes = proposal.total_votes + delegate_profile.voting_power;
        
        // Update delegate metrics
        delegate_profile.performance_metrics.total_proposals_voted = 
            delegate_profile.performance_metrics.total_proposals_voted + 1;
        vector::push_back(&mut delegate_profile.voting_history, proposal_id);
        
        // Emit event
        event::emit(VoteCasted {
            proposal_id,
            voter: delegate_addr,
            vote,
            voting_power: delegate_profile.voting_power,
            timestamp: timestamp::now_seconds(),
        });
    }

    // AI delegate automated voting
    public entry fun ai_delegate_vote(
        ai_delegate_owner: &signer,
        proposal_id: u64,
        predicted_vote: u8
    ) acquires AIDelegate, ProposalRegistry {
        let owner_addr = signer::address_of(ai_delegate_owner);
        let ai_delegate = borrow_global_mut<AIDelegate>(owner_addr);
        
        // Get proposal from registry
        let proposal_registry = borrow_global_mut<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut proposal_registry.proposals, proposal_id);
        
        // Verify AI delegate is active
        assert!(ai_delegate.is_active, E_INVALID_DELEGATE);
        assert!(ai_delegate.owner == owner_addr, E_NOT_AUTHORIZED);
        
        // Verify proposal is active
        assert!(proposal.state == PROPOSAL_ACTIVE, E_VOTING_ENDED);
        assert!(timestamp::now_seconds() <= proposal.end_time, E_VOTING_ENDED);
        
        // Generate unique voter ID for AI delegate
        let ai_voter_id = owner_addr; // Use owner address as unique ID
        
        // Verify AI delegate hasn't already voted
        assert!(!table::contains(&proposal.voters, ai_voter_id), E_ALREADY_VOTED);
        
        // Cast vote with AI delegate's voting power
        table::add(&mut proposal.voters, ai_voter_id, predicted_vote);
        
        // Update vote counts
        if (predicted_vote == VOTE_YES) {
            proposal.yes_votes = proposal.yes_votes + ai_delegate.voting_power;
        } else if (predicted_vote == VOTE_NO) {
            proposal.no_votes = proposal.no_votes + ai_delegate.voting_power;
        } else {
            proposal.abstain_votes = proposal.abstain_votes + ai_delegate.voting_power;
        };
        
        proposal.total_votes = proposal.total_votes + ai_delegate.voting_power;
        
        // Update AI delegate metrics
        vector::push_back(&mut ai_delegate.voting_history, proposal_id);
        
        // Emit event
        event::emit(VoteCasted {
            proposal_id,
            voter: ai_voter_id,
            vote: predicted_vote,
            voting_power: ai_delegate.voting_power,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Update AI delegate model
    public entry fun update_ai_delegate_model(
        owner: &signer,
        new_training_data: vector<u8>,
        new_preferences: vector<u8>
    ) acquires AIDelegate {
        let owner_addr = signer::address_of(owner);
        let ai_delegate = borrow_global_mut<AIDelegate>(owner_addr);
        
        // Verify owner
        assert!(ai_delegate.owner == owner_addr, E_NOT_AUTHORIZED);
        
        // Update model
        ai_delegate.training_data = new_training_data;
        ai_delegate.preferences = new_preferences;
        ai_delegate.model_version = ai_delegate.model_version + 1;
        ai_delegate.performance_metrics.learning_progress = 
            ai_delegate.performance_metrics.learning_progress + 10;
    }

    // Platform governance functions
    public entry fun update_platform_config(
        admin: &signer,
        new_fee_rate: u64,
        new_premium_cost: u64,
        new_delegate_fee: u64,
        new_dao_fee: u64
    ) acquires PlatformConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify admin
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);
        
        // Update config
        config.platform_fee_rate = new_fee_rate;
        config.premium_subscription_cost = new_premium_cost;
        config.delegate_registration_fee = new_delegate_fee;
        config.dao_creation_fee = new_dao_fee;
    }

    // Emergency pause
    public entry fun emergency_pause(admin: &signer) acquires PlatformConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify admin
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);
        
        // Pause platform
        config.is_paused = true;
    }

    // Unpause platform
    public entry fun unpause(admin: &signer) acquires PlatformConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify admin
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);
        
        // Unpause platform
        config.is_paused = false;
    }

    // Withdraw platform revenue
    public entry fun withdraw_platform_revenue(
        admin: &signer,
        amount: u64
    ) acquires PlatformConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify admin
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);
        
        // Since treasury is the admin address, just transfer from admin to admin
        // This is a simplified version - in production you'd want a separate treasury
        let payment = coin::withdraw<AptosCoin>(admin, amount);
        coin::deposit(admin_addr, payment);
    }

    // View functions
    #[view]
    public fun get_user_profile(user_address: address): (address, u8, u64, u64, bool, u64, u64) acquires UserProfile {
        let profile = borrow_global<UserProfile>(user_address);
        (profile.address, profile.user_type, profile.reputation_score, profile.contribution_score, 
         profile.is_premium, profile.premium_expires, profile.voting_power)
    }

    #[view]
    public fun get_dao_by_id(dao_id: u64): (u64, String, String, String, address, u64, u64, bool) acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        (dao.id, dao.dao_code, dao.name, dao.description, dao.creator, dao.total_supply, dao.treasury_balance, dao.is_active)
    }

    #[view]
    public fun get_dao_by_code(dao_code: String): (u64, String, String, String, address, u64, u64, bool) acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.dao_by_code, dao_code), E_DAO_NOT_FOUND);
        let dao_id = *table::borrow(&registry.dao_by_code, dao_code);
        let dao = table::borrow(&registry.daos, dao_id);
        (dao.id, dao.dao_code, dao.name, dao.description, dao.creator, dao.total_supply, dao.treasury_balance, dao.is_active)
    }

    #[view]
    public fun get_proposal(proposal_id: u64): (u64, u64, String, String, address, u64, u64, u8) acquires ProposalRegistry {
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow(&proposal_registry.proposals, proposal_id);
        (proposal.id, proposal.dao_id, proposal.title, proposal.description, proposal.proposer, 
         proposal.start_time, proposal.end_time, proposal.state)
    }

    #[view]
    public fun get_task(task_id: u64): (u64, u64, String, String, address, u64, u64, u8) acquires TaskRegistry {
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&task_registry.tasks, task_id), E_TASK_NOT_FOUND);
        let task = table::borrow(&task_registry.tasks, task_id);
        (task.id, task.dao_id, task.title, task.description, task.creator, task.bounty_amount, task.deadline, task.state)
    }

    #[view]
    public fun get_delegate(delegate_address: address): (address, String, String, String, u64, bool) acquires Delegate {
        let delegate = borrow_global<Delegate>(delegate_address);
        (delegate.address, delegate.name, delegate.description, delegate.philosophy, delegate.voting_power, delegate.verification_status)
    }

    #[view]
    public fun get_ai_delegate(ai_delegate_address: address): (u64, address, String, u8, u64, u64, bool) acquires AIDelegate {
        let ai_delegate = borrow_global<AIDelegate>(ai_delegate_address);
        (ai_delegate.id, ai_delegate.owner, ai_delegate.name, ai_delegate.risk_tolerance, ai_delegate.voting_power, ai_delegate.model_version, ai_delegate.is_active)
    }

    #[view]
    public fun get_aip(aip_id: u64): (u64, String, String, address, String, String, u64, u64) acquires AIPRegistry {
        let aip_registry = borrow_global<AIPRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&aip_registry.aips, aip_id), E_AIP_NOT_FOUND);
        let aip = table::borrow(&aip_registry.aips, aip_id);
        (aip.id, aip.title, aip.description, aip.author, aip.category, aip.status, aip.created_at, aip.updated_at)
    }

    #[view]
    public fun get_platform_stats(): (u64, u64, u64, u64, u64, u64, u64, u64) acquires PlatformStats {
        let stats = borrow_global<PlatformStats>(ADMIN_ADDRESS);
        (stats.total_users, stats.total_daos, stats.total_proposals, stats.total_tasks, stats.total_delegates, stats.total_ai_delegates, stats.total_volume, stats.platform_revenue)
    }

    #[view]
    public fun get_platform_config(): (address, u64, u64, u64, u64, address, bool) acquires PlatformConfig {
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        (config.admin, config.platform_fee_rate, config.premium_subscription_cost, config.delegate_registration_fee, config.dao_creation_fee, config.treasury, config.is_paused)
    }

    #[view]
    public fun get_user_voting_power(user_address: address): u64 acquires UserProfile {
        let profile = borrow_global<UserProfile>(user_address);
        profile.voting_power
    }

    #[view]
    public fun get_proposal_results(proposal_id: u64): (u64, u64, u64, u64) acquires ProposalRegistry {
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow(&proposal_registry.proposals, proposal_id);
        (proposal.yes_votes, proposal.no_votes, proposal.abstain_votes, proposal.total_votes)
    }

    #[view]
    public fun has_voted(proposal_id: u64, voter: address): bool acquires ProposalRegistry {
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&proposal_registry.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow(&proposal_registry.proposals, proposal_id);
        table::contains(&proposal.voters, voter)
    }

    #[view]
    public fun get_dao_member_count(dao_id: u64): u64 acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        vector::length(&dao.members)
    }

    #[view]
    public fun is_dao_member(dao_id: u64, user_address: address): bool acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        vector::contains(&dao.members, &user_address)
    }

    #[view]
    public fun get_delegate_voting_power(delegate_address: address): u64 acquires Delegate {
        let delegate = borrow_global<Delegate>(delegate_address);
        delegate.voting_power
    }

    #[view]
    public fun get_ai_delegate_performance(ai_delegate_address: address): (u64, u64, u64, u64, u64) acquires AIDelegate {
        let ai_delegate = borrow_global<AIDelegate>(ai_delegate_address);
        (ai_delegate.performance_metrics.accuracy_score, ai_delegate.performance_metrics.consistency_score, 
         ai_delegate.performance_metrics.alignment_score, ai_delegate.performance_metrics.override_rate, ai_delegate.performance_metrics.learning_progress)
    }

    #[view]
    public fun is_premium_user(user_address: address): bool acquires UserProfile {
        let profile = borrow_global<UserProfile>(user_address);
        profile.is_premium && profile.premium_expires > timestamp::now_seconds()
    }

    #[view]
    public fun get_task_status(task_id: u64): u8 acquires TaskRegistry {
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&task_registry.tasks, task_id), E_TASK_NOT_FOUND);
        let task = table::borrow(&task_registry.tasks, task_id);
        task.state
    }

    #[view]
    public fun get_platform_revenue(): u64 acquires PlatformStats {
        let stats = borrow_global<PlatformStats>(ADMIN_ADDRESS);
        stats.platform_revenue
    }

    // Additional utility functions for complex operations
    public entry fun batch_delegate_votes(
        delegate: &signer,
        proposal_ids: vector<u64>,
        votes: vector<u8>
    ) acquires Delegate, ProposalRegistry {
        let len = vector::length(&proposal_ids);
        assert!(len == vector::length(&votes), E_INVALID_PROPOSAL);
        
        let i = 0;
        while (i < len) {
            let proposal_id = *vector::borrow(&proposal_ids, i);
            let vote = *vector::borrow(&votes, i);
            
            delegate_vote(delegate, proposal_id, vote);
            i = i + 1;
        };
    }

    // Analytics helper functions
    #[view]
    public fun get_dao_analytics(dao_id: u64): (u64, u64, u64, u64, u64) acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        (
            vector::length(&dao.members),
            dao.proposal_count,
            dao.task_count,
            dao.total_supply,
            dao.treasury_balance
        )
    }

    #[view]
    public fun get_dao_code_by_id(dao_id: u64): String acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        dao.dao_code
    }

    // List all DAO IDs (for discovery)
    #[view]
    public fun get_all_dao_ids(): vector<u64> acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        let dao_ids = vector::empty<u64>();
        let i = 1;
        while (i < registry.next_dao_id) {
            if (table::contains(&registry.daos, i)) {
                vector::push_back(&mut dao_ids, i);
            };
            i = i + 1;
        };
        dao_ids
    }

    // Get all DAOs that a user has joined with complete information
    #[view]
    public fun get_daos_by_user(user_address: address): vector<DAOInfo> acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        let user_daos = vector::empty<DAOInfo>();
        
        // Iterate through all DAOs
        let i = 1;
        while (i < registry.next_dao_id) {
            if (table::contains(&registry.daos, i)) {
                let dao = table::borrow(&registry.daos, i);
                // Check if user is a member of this DAO
                if (vector::contains(&dao.members, &user_address)) {
                    let dao_info = DAOInfo {
                        id: dao.id,
                        dao_code: dao.dao_code,
                        name: dao.name,
                        description: dao.description,
                        creator: dao.creator,
                        governors: dao.governors,
                        members: dao.members,
                        total_supply: dao.total_supply,
                        governance_token: dao.governance_token,
                        minimum_proposal_threshold: dao.minimum_proposal_threshold,
                        voting_period: dao.voting_period,
                        execution_delay: dao.execution_delay,
                        proposal_count: dao.proposal_count,
                        task_count: dao.task_count,
                        treasury_balance: dao.treasury_balance,
                        is_active: dao.is_active,
                        created_at: dao.created_at,
                        member_count: vector::length(&dao.members),
                        settings: dao.settings,
                    };
                    vector::push_back(&mut user_daos, dao_info);
                };
            };
            i = i + 1;
        };
        
        user_daos
    }

    // Get simplified DAO info for DAOs user has joined (for lighter queries)
    #[view]
    public fun get_user_dao_summary(user_address: address): vector<DAOSummary> acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        let dao_summaries = vector::empty<DAOSummary>();
        
        // Iterate through all DAOs
        let i = 1;
        while (i < registry.next_dao_id) {
            if (table::contains(&registry.daos, i)) {
                let dao = table::borrow(&registry.daos, i);
                // Check if user is a member of this DAO
                if (vector::contains(&dao.members, &user_address)) {
                    let summary = DAOSummary {
                        id: dao.id,
                        dao_code: dao.dao_code,
                        name: dao.name,
                        description: dao.description,
                        member_count: vector::length(&dao.members),
                        is_active: dao.is_active,
                    };
                    vector::push_back(&mut dao_summaries, summary);
                };
            };
            i = i + 1;
        };
        
        dao_summaries
    }

    // Get user's voting power in a specific DAO
    #[view]
    public fun get_user_voting_power_in_dao(user_address: address, dao_id: u64): u64 acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        
        if (table::contains(&dao.voting_power_distribution, user_address)) {
            *table::borrow(&dao.voting_power_distribution, user_address)
        } else {
            0
        }
    }

    // Get detailed user membership info for a specific DAO
    #[view]
    public fun get_user_dao_membership_info(user_address: address, dao_id: u64): (bool, u64, bool, bool) acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        assert!(table::contains(&registry.daos, dao_id), E_DAO_NOT_FOUND);
        let dao = table::borrow(&registry.daos, dao_id);
        
        let is_member = vector::contains(&dao.members, &user_address);
        let voting_power = if (is_member && table::contains(&dao.voting_power_distribution, user_address)) {
            *table::borrow(&dao.voting_power_distribution, user_address)
        } else {
            0
        };
        let is_governor = vector::contains(&dao.governors, &user_address);
        let is_creator = dao.creator == user_address;
        
        (is_member, voting_power, is_governor, is_creator)
    }

    // Get count of DAOs user has joined
    #[view]
    public fun get_user_dao_count(user_address: address): u64 acquires DAORegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        let count = 0;
        
        let i = 1;
        while (i < registry.next_dao_id) {
            if (table::contains(&registry.daos, i)) {
                let dao = table::borrow(&registry.daos, i);
                if (vector::contains(&dao.members, &user_address)) {
                    count = count + 1;
                };
            };
            i = i + 1;
        };
        
        count
    }

    // Helper function: Get ALL proposals for a DAO (now unlimited!)
    fun get_dao_proposals_for_user(dao_id: u64, user_address: address): vector<ProposalInfo> acquires ProposalRegistry {
        let proposals = vector::empty<ProposalInfo>();
        
        // Get all proposals for this DAO from the central registry
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        if (table::contains(&proposal_registry.proposals_by_dao, dao_id)) {
            let dao_proposal_ids = table::borrow(&proposal_registry.proposals_by_dao, dao_id);
            let i = 0;
            while (i < vector::length(dao_proposal_ids)) {
                let proposal_id = *vector::borrow(dao_proposal_ids, i);
                let proposal = table::borrow(&proposal_registry.proposals, proposal_id);
                
                let user_voted = table::contains(&proposal.voters, user_address);
                let user_vote = if (user_voted) {
                    option::some(*table::borrow(&proposal.voters, user_address))
                } else {
                    option::none()
                };
                
                let proposal_info = ProposalInfo {
                    id: proposal.id,
                    dao_id: proposal.dao_id,
                    title: proposal.title,
                    description: proposal.description,
                    proposer: proposal.proposer,
                    start_time: proposal.start_time,
                    end_time: proposal.end_time,
                    execution_time: proposal.execution_time,
                    yes_votes: proposal.yes_votes,
                    no_votes: proposal.no_votes,
                    abstain_votes: proposal.abstain_votes,
                    total_votes: proposal.total_votes,
                    state: proposal.state,
                    linked_aip: proposal.linked_aip,
                    created_at: proposal.created_at,
                    user_voted,
                    user_vote,
                };
                vector::push_back(&mut proposals, proposal_info);
                i = i + 1;
            };
        };
        
        proposals
    }

    // Helper function: Get ALL tasks for a DAO (now unlimited!)
    fun get_dao_tasks_for_user(dao_id: u64, user_address: address): vector<TaskInfo> acquires TaskRegistry {
        let tasks = vector::empty<TaskInfo>();
        
        // Get all tasks for this DAO from the central registry
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        if (table::contains(&task_registry.tasks_by_dao, dao_id)) {
            let dao_task_ids = table::borrow(&task_registry.tasks_by_dao, dao_id);
            let i = 0;
            while (i < vector::length(dao_task_ids)) {
                let task_id = *vector::borrow(dao_task_ids, i);
                let task = table::borrow(&task_registry.tasks, task_id);
                
                let task_info = TaskInfo {
                    id: task.id,
                    dao_id: task.dao_id,
                    title: task.title,
                    description: task.description,
                    creator: task.creator,
                    assignee: task.assignee,
                    bounty_amount: task.bounty_amount,
                    deadline: task.deadline,
                    state: task.state,
                    created_at: task.created_at,
                    user_is_creator: task.creator == user_address,
                    user_is_assignee: option::contains(&task.assignee, &user_address),
                };
                vector::push_back(&mut tasks, task_info);
                i = i + 1;
            };
        };
        
        tasks
    }

    // Helper function: Count user proposals in a DAO
    fun count_user_proposals_in_dao(user_address: address, dao_id: u64, proposals: &vector<ProposalInfo>): u64 {
        let count = 0;
        let i = 0;
        while (i < vector::length(proposals)) {
            let proposal = vector::borrow(proposals, i);
            if (proposal.proposer == user_address && proposal.dao_id == dao_id) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }

    // Helper function: Count user tasks in a DAO
    fun count_user_tasks_in_dao(dao_id: u64, tasks: &vector<TaskInfo>): u64 {
        let count = 0;
        let i = 0;
        while (i < vector::length(tasks)) {
            let task = vector::borrow(tasks, i);
            if (task.user_is_creator && task.dao_id == dao_id) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }

    // Helper function: Count user votes and total voting power used
    fun count_user_votes_in_dao(proposals: &vector<ProposalInfo>): (u64, u64) {
        let votes_count = 0;
        let total_power_used = 0;
        let i = 0;
        while (i < vector::length(proposals)) {
            let proposal = vector::borrow(proposals, i);
            if (proposal.user_voted) {
                votes_count = votes_count + 1;
                // Note: We don't have voting power per vote stored, so this is approximate
                total_power_used = total_power_used + 100; // Assuming base voting power
            };
            i = i + 1;
        };
        (votes_count, total_power_used)
    }

    // Helper function: Get user's AIP info from central registry
    fun get_user_aip_info(user_address: address): Option<AIPInfo> acquires AIPRegistry {
        let aip_registry = borrow_global<AIPRegistry>(ADMIN_ADDRESS);
        if (table::contains(&aip_registry.aips_by_author, user_address)) {
            let user_aip_ids = table::borrow(&aip_registry.aips_by_author, user_address);
            // Return the first AIP if user has one (most recently created)
            if (vector::length(user_aip_ids) > 0) {
                let first_aip_id = *vector::borrow(user_aip_ids, 0);
                let aip = table::borrow(&aip_registry.aips, first_aip_id);
                option::some(AIPInfo {
                    id: aip.id,
                    title: aip.title,
                    description: aip.description,
                    category: aip.category,
                    status: aip.status,
                    created_at: aip.created_at,
                })
            } else {
                option::none()
            }
        } else {
            option::none()
        }
    }

    // 🚀 ULTIMATE FUNCTION: Get EVERYTHING about DAOs a user has joined - FULLY UNLIMITED!
    // 
    // This function returns a complete ecosystem view of all DAOs a user has joined, including:
    // - Complete DAO information (name, code, settings, governance rules, members, etc.)
    // - User's membership details (voting power, roles, permissions)
    // - ALL proposals in each DAO (with user's voting history) - NO LONGER LIMITED!
    // - ALL tasks in each DAO (with user's creation/assignment status) - NO LONGER LIMITED!
    // - User's AIP information if they have created one
    // - Aggregated statistics across all DAOs
    //
    // 🎉 ALL LIMITATIONS REMOVED! 🎉
    // - Proposals/Tasks are now in central registries, so we get COMPLETE DAO history
    // - Users can have multiple proposals/tasks/AIPs
    // - Full discovery and comprehensive data access
    //
    // Returns: UserDAOEcosystem with EVERYTHING about the user's DAO participation
    #[view]
    public fun get_complete_user_dao_ecosystem(user_address: address): UserDAOEcosystem acquires DAORegistry, ProposalRegistry, TaskRegistry, AIPRegistry {
        let registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        let complete_daos = vector::empty<CompleteDAOData>();
        
        // Aggregate counters
        let total_daos_joined = 0;
        let total_voting_power = 0;
        let total_proposals_created = 0;
        let total_tasks_created = 0;
        let total_votes_cast = 0;
        
        // Iterate through all DAOs
        let i = 1;
        while (i < registry.next_dao_id) {
            if (table::contains(&registry.daos, i)) {
                let dao = table::borrow(&registry.daos, i);
                
                // Check if user is a member of this DAO
                if (vector::contains(&dao.members, &user_address)) {
                    total_daos_joined = total_daos_joined + 1;
                    
                    // Build DAO info
                    let dao_info = DAOInfo {
                        id: dao.id,
                        dao_code: dao.dao_code,
                        name: dao.name,
                        description: dao.description,
                        creator: dao.creator,
                        governors: dao.governors,
                        members: dao.members,
                        total_supply: dao.total_supply,
                        governance_token: dao.governance_token,
                        minimum_proposal_threshold: dao.minimum_proposal_threshold,
                        voting_period: dao.voting_period,
                        execution_delay: dao.execution_delay,
                        proposal_count: dao.proposal_count,
                        task_count: dao.task_count,
                        treasury_balance: dao.treasury_balance,
                        is_active: dao.is_active,
                        created_at: dao.created_at,
                        member_count: vector::length(&dao.members),
                        settings: dao.settings,
                    };
                    
                    // Build user membership info
                    let user_voting_power = if (table::contains(&dao.voting_power_distribution, user_address)) {
                        *table::borrow(&dao.voting_power_distribution, user_address)
                    } else { 0 };
                    
                    total_voting_power = total_voting_power + user_voting_power;
                    
                    let user_membership = UserDAOMembership {
                        is_member: true,
                        voting_power: user_voting_power,
                        is_governor: vector::contains(&dao.governors, &user_address),
                        is_creator: dao.creator == user_address,
                        join_date: dao.created_at, // Approximation - we don't track exact join date
                    };
                    
                    // Get ALL proposals for this DAO (limited by current storage model)
                    let proposals = get_dao_proposals_for_user(dao.id, user_address);
                    
                    // Get ALL tasks for this DAO (limited by current storage model)
                    let tasks = get_dao_tasks_for_user(dao.id, user_address);
                    
                    // Calculate user-specific stats for this DAO
                    let user_proposals_created = count_user_proposals_in_dao(user_address, dao.id, &proposals);
                    let user_tasks_created = count_user_tasks_in_dao(dao.id, &tasks);
                    let (user_votes_cast_dao, total_voting_power_used_dao) = count_user_votes_in_dao(&proposals);
                    
                    total_proposals_created = total_proposals_created + user_proposals_created;
                    total_tasks_created = total_tasks_created + user_tasks_created;
                    total_votes_cast = total_votes_cast + user_votes_cast_dao;
                    
                    // Get user's AIP info if they have one
                    let user_aip = get_user_aip_info(user_address);
                    
                    // Build complete DAO data
                    let complete_dao_data = CompleteDAOData {
                        dao_info,
                        user_membership,
                        proposals,
                        tasks,
                        user_proposals_created,
                        user_tasks_created,
                        user_votes_cast: user_votes_cast_dao,
                        total_voting_power_used: total_voting_power_used_dao,
                        user_aip,
                    };
                    
                    vector::push_back(&mut complete_daos, complete_dao_data);
                };
            };
            i = i + 1;
        };
        
        // Build and return complete ecosystem
        UserDAOEcosystem {
            user_address,
            total_daos_joined,
            total_voting_power,
            total_proposals_created,
            total_tasks_created,
            total_votes_cast,
            daos: complete_daos,
            generated_at: timestamp::now_seconds(),
        }
    }

    #[view]
    public fun get_delegate_analytics(delegate_address: address): (u64, u64, u64, u64) acquires Delegate {
        let delegate = borrow_global<Delegate>(delegate_address);
        (
            delegate.voting_power,
            vector::length(&delegate.delegators),
            delegate.performance_metrics.total_proposals_voted,
            delegate.performance_metrics.participation_rate
        )
    }

    // 🚀 NEW DISCOVERY FUNCTIONS - ENABLED BY CENTRAL REGISTRIES!

    // Get all proposal IDs for a DAO
    #[view]
    public fun get_dao_proposal_ids(dao_id: u64): vector<u64> acquires ProposalRegistry {
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        if (table::contains(&proposal_registry.proposals_by_dao, dao_id)) {
            *table::borrow(&proposal_registry.proposals_by_dao, dao_id)
        } else {
            vector::empty<u64>()
        }
    }

    // Get all task IDs for a DAO
    #[view]
    public fun get_dao_task_ids(dao_id: u64): vector<u64> acquires TaskRegistry {
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        if (table::contains(&task_registry.tasks_by_dao, dao_id)) {
            *table::borrow(&task_registry.tasks_by_dao, dao_id)
        } else {
            vector::empty<u64>()
        }
    }

    // Get all AIP IDs for an author
    #[view]
    public fun get_user_aip_ids(user_address: address): vector<u64> acquires AIPRegistry {
        let aip_registry = borrow_global<AIPRegistry>(ADMIN_ADDRESS);
        if (table::contains(&aip_registry.aips_by_author, user_address)) {
            *table::borrow(&aip_registry.aips_by_author, user_address)
        } else {
            vector::empty<u64>()
        }
    }

    // Get all proposals created by a user (across all DAOs)
    #[view]
    public fun get_user_created_proposals(user_address: address): vector<ProposalInfo> acquires ProposalRegistry {
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        let user_proposals = vector::empty<ProposalInfo>();
        
        // Search through all proposals to find those created by this user
        let proposal_id = 1;
        while (proposal_id < proposal_registry.next_proposal_id) {
            if (table::contains(&proposal_registry.proposals, proposal_id)) {
                let proposal = table::borrow(&proposal_registry.proposals, proposal_id);
                if (proposal.proposer == user_address) {
                    let user_voted = table::contains(&proposal.voters, user_address);
                    let user_vote = if (user_voted) {
                        option::some(*table::borrow(&proposal.voters, user_address))
                    } else {
                        option::none()
                    };
                    
                    let proposal_info = ProposalInfo {
                        id: proposal.id,
                        dao_id: proposal.dao_id,
                        title: proposal.title,
                        description: proposal.description,
                        proposer: proposal.proposer,
                        start_time: proposal.start_time,
                        end_time: proposal.end_time,
                        execution_time: proposal.execution_time,
                        yes_votes: proposal.yes_votes,
                        no_votes: proposal.no_votes,
                        abstain_votes: proposal.abstain_votes,
                        total_votes: proposal.total_votes,
                        state: proposal.state,
                        linked_aip: proposal.linked_aip,
                        created_at: proposal.created_at,
                        user_voted,
                        user_vote,
                    };
                    vector::push_back(&mut user_proposals, proposal_info);
                };
            };
            proposal_id = proposal_id + 1;
        };
        
        user_proposals
    }

    // Get all tasks created by a user (across all DAOs)
    #[view]
    public fun get_user_created_tasks(user_address: address): vector<TaskInfo> acquires TaskRegistry {
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        let user_tasks = vector::empty<TaskInfo>();
        
        // Search through all tasks to find those created by this user
        let task_id = 1;
        while (task_id < task_registry.next_task_id) {
            if (table::contains(&task_registry.tasks, task_id)) {
                let task = table::borrow(&task_registry.tasks, task_id);
                if (task.creator == user_address) {
                    let task_info = TaskInfo {
                        id: task.id,
                        dao_id: task.dao_id,
                        title: task.title,
                        description: task.description,
                        creator: task.creator,
                        assignee: task.assignee,
                        bounty_amount: task.bounty_amount,
                        deadline: task.deadline,
                        state: task.state,
                        created_at: task.created_at,
                        user_is_creator: true,
                        user_is_assignee: option::contains(&task.assignee, &user_address),
                    };
                    vector::push_back(&mut user_tasks, task_info);
                };
            };
            task_id = task_id + 1;
        };
        
        user_tasks
    }

    // Get all proposals in a DAO with complete info
    #[view]
    public fun get_dao_proposals(dao_id: u64): vector<ProposalInfo> acquires ProposalRegistry {
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        let dao_proposals = vector::empty<ProposalInfo>();
        
        if (table::contains(&proposal_registry.proposals_by_dao, dao_id)) {
            let dao_proposal_ids = table::borrow(&proposal_registry.proposals_by_dao, dao_id);
            let i = 0;
            while (i < vector::length(dao_proposal_ids)) {
                let proposal_id = *vector::borrow(dao_proposal_ids, i);
                let proposal = table::borrow(&proposal_registry.proposals, proposal_id);
                
                let proposal_info = ProposalInfo {
                    id: proposal.id,
                    dao_id: proposal.dao_id,
                    title: proposal.title,
                    description: proposal.description,
                    proposer: proposal.proposer,
                    start_time: proposal.start_time,
                    end_time: proposal.end_time,
                    execution_time: proposal.execution_time,
                    yes_votes: proposal.yes_votes,
                    no_votes: proposal.no_votes,
                    abstain_votes: proposal.abstain_votes,
                    total_votes: proposal.total_votes,
                    state: proposal.state,
                    linked_aip: proposal.linked_aip,
                    created_at: proposal.created_at,
                    user_voted: false, // Generic view - no specific user context
                    user_vote: option::none(),
                };
                vector::push_back(&mut dao_proposals, proposal_info);
                i = i + 1;
            };
        };
        
        dao_proposals
    }

    // Get all tasks in a DAO with complete info
    #[view]
    public fun get_dao_tasks(dao_id: u64): vector<TaskInfo> acquires TaskRegistry {
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        let dao_tasks = vector::empty<TaskInfo>();
        
        if (table::contains(&task_registry.tasks_by_dao, dao_id)) {
            let dao_task_ids = table::borrow(&task_registry.tasks_by_dao, dao_id);
            let i = 0;
            while (i < vector::length(dao_task_ids)) {
                let task_id = *vector::borrow(dao_task_ids, i);
                let task = table::borrow(&task_registry.tasks, task_id);
                
                let task_info = TaskInfo {
                    id: task.id,
                    dao_id: task.dao_id,
                    title: task.title,
                    description: task.description,
                    creator: task.creator,
                    assignee: task.assignee,
                    bounty_amount: task.bounty_amount,
                    deadline: task.deadline,
                    state: task.state,
                    created_at: task.created_at,
                    user_is_creator: false, // Generic view - no specific user context
                    user_is_assignee: false,
                };
                vector::push_back(&mut dao_tasks, task_info);
                i = i + 1;
            };
        };
        
        dao_tasks
    }

    // Get all AIPs by a user
    #[view]
    public fun get_user_aips(user_address: address): vector<UserAIPInfo> acquires AIPRegistry {
        let aip_registry = borrow_global<AIPRegistry>(ADMIN_ADDRESS);
        let user_aips = vector::empty<UserAIPInfo>();
        
        if (table::contains(&aip_registry.aips_by_author, user_address)) {
            let user_aip_ids = table::borrow(&aip_registry.aips_by_author, user_address);
            let i = 0;
            while (i < vector::length(user_aip_ids)) {
                let aip_id = *vector::borrow(user_aip_ids, i);
                let aip = table::borrow(&aip_registry.aips, aip_id);
                
                let aip_info = UserAIPInfo {
                    id: aip.id,
                    title: aip.title,
                    description: aip.description,
                    category: aip.category,
                    status: aip.status,
                    implementation_status: aip.implementation_status,
                    created_at: aip.created_at,
                    updated_at: aip.updated_at,
                };
                vector::push_back(&mut user_aips, aip_info);
                i = i + 1;
            };
        };
        
        user_aips
    }

    // Get summary statistics for the entire platform
    #[view]
    public fun get_platform_summary(): (u64, u64, u64, u64) acquires ProposalRegistry, TaskRegistry, AIPRegistry, DAORegistry {
        let dao_registry = borrow_global<DAORegistry>(ADMIN_ADDRESS);
        let proposal_registry = borrow_global<ProposalRegistry>(ADMIN_ADDRESS);
        let task_registry = borrow_global<TaskRegistry>(ADMIN_ADDRESS);
        let aip_registry = borrow_global<AIPRegistry>(ADMIN_ADDRESS);
        
        (
            dao_registry.next_dao_id - 1,        // Total DAOs created
            proposal_registry.next_proposal_id - 1,  // Total proposals created
            task_registry.next_task_id - 1,      // Total tasks created
            aip_registry.next_aip_id - 1         // Total AIPs created
        )
    }

    // Migration and upgrade functions
    public entry fun migrate_user_data(
        admin: &signer
    ) acquires PlatformConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global<PlatformConfig>(ADMIN_ADDRESS);
        
        // Verify admin
        assert!(admin_addr == config.admin, E_NOT_AUTHORIZED);
        
        // Migration logic would go here
        // This is a placeholder for future upgrade functionality
    }
}