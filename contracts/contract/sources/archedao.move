module dao_portal::portal_system {
    use std::signer;
    use std::string::String;
    use std::vector;
    use std::option::{Self, Option};
    use std::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::table::{Self, Table};

    // Constants
    const MINIMUM_PORTAL_STAKE: u64 = 2000000; // 2 APT (in octas)
    const MINIMUM_PROPOSAL_STAKE: u64 = 100000; // 0.1 APT (in octas)
    const VOTES_PER_10_APT: u64 = 1000000000; // 10 APT in octas
    const COMMUNITY_VOTING_POWER_MAX: u8 = 100;
    
    // Admin address - should be the module publisher
    const ADMIN_ADDRESS: address = @0x692906717ffbfc458c597613e0dd42c8f18577d28c03d2fdb768a07aa0fee713;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_STAKE: u64 = 2;
    const E_PORTAL_NOT_FOUND: u64 = 3;
    const E_PROPOSAL_NOT_FOUND: u64 = 4;
    const E_INVALID_VOTING_POWER: u64 = 5;
    const E_VOTING_ENDED: u64 = 6;
    const E_ALREADY_VOTED: u64 = 7;
    const E_INVALID_OPTION: u64 = 8;
    const E_AI_COUNCILOR_NOT_FOUND: u64 = 9;

    // Enums for event types
    const EVENT_TYPE_RAFFLE: u8 = 1;
    const EVENT_TYPE_GIVEAWAY: u8 = 2;
    const EVENT_TYPE_HACKATHON: u8 = 3;
    const EVENT_TYPE_GOVERNANCE: u8 = 4;
    const EVENT_TYPE_COMMUNITY_CALL: u8 = 5;

    // Proposal types
    const PROPOSAL_TYPE_YES_NO: u8 = 1;
    const PROPOSAL_TYPE_MULTIPLE_CHOICE: u8 = 2;
    const PROPOSAL_TYPE_WEIGHTED_RANKING: u8 = 3;

    // AI Councilor behavior structure
    struct AIBehavior has store, copy, drop {
        risk_tolerance: u8, // 1-10 scale
        roi_preference: u8, // 1-10 scale
        community_engagement: u8, // 1-10 scale
        governance_participation: u8, // 1-10 scale
        preferred_event_types: vector<u8>, // Event types they're interested in
        min_stake_threshold: u64, // Minimum stake they're willing to make
        max_stake_threshold: u64, // Maximum stake they're willing to make
        keywords: vector<String>, // Keywords for proposal matching
        auto_vote_enabled: bool,
    }

    // AI Councilor structure
    struct AICounsilor has store, copy, drop {
        owner: address,
        name: String,
        behavior: AIBehavior,
        created_at: u64,
        active: bool,
    }

    // Portal structure
    struct Portal has store, copy, drop {
        id: u64,
        name: String,
        description: String,
        owner: address,
        governors: vector<address>,
        staked_amount: u64,
        community_voting_power: u8, // Percentage (0-100)
        created_at: u64,
        active: bool,
        native_token: Option<String>, // Optional native token for voting
    }

    // Proposal option structure
    struct ProposalOption has store, copy, drop {
        id: u8,
        title: String,
        description: String,
        votes: u64,
        weighted_score: u64,
    }

    // Vote record structure
    struct Vote has store, copy, drop {
        voter: address,
        option_id: u8,
        stake_amount: u64,
        score: u8, // 1-10 scale for weighted voting
        timestamp: u64,
    }

    // Proposal structure
    struct Proposal has store, copy, drop {
        id: u64,
        portal_id: u64,
        title: String,
        description: String,
        proposal_type: u8,
        options: vector<ProposalOption>,
        votes: vector<Vote>,
        voting_end_time: u64,
        min_stake: u64,
        total_staked: u64,
        created_by: address,
        created_at: u64,
        finalized: bool,
        result: Option<u8>, // Winning option ID
    }

    // Community Event structure
    struct CommunityEvent has store, copy, drop {
        id: u64,
        portal_id: u64,
        event_type: u8,
        title: String,
        description: String,
        start_time: u64,
        end_time: u64,
        requirements: String,
        rewards: String,
        max_participants: u64,
        participants: vector<address>,
        created_by: address,
        active: bool,
    }

    // Portal system state
    struct PortalSystem has key {
        portals: Table<u64, Portal>,
        proposals: Table<u64, Proposal>,
        events: Table<u64, CommunityEvent>,
        ai_councilors: Table<address, vector<AICounsilor>>,
        next_portal_id: u64,
        next_proposal_id: u64,
        next_event_id: u64,
        // Event handles for tracking
        portal_created_events: EventHandle<PortalCreatedEvent>,
        proposal_created_events: EventHandle<ProposalCreatedEvent>,
        vote_cast_events: EventHandle<VoteCastEvent>,
        event_created_events: EventHandle<EventCreatedEvent>,
    }

    // Event structures
    struct PortalCreatedEvent has drop, store {
        portal_id: u64,
        name: String,
        owner: address,
        stake_amount: u64,
    }

    struct ProposalCreatedEvent has drop, store {
        proposal_id: u64,
        portal_id: u64,
        title: String,
        created_by: address,
    }

    struct VoteCastEvent has drop, store {
        proposal_id: u64,
        voter: address,
        option_id: u8,
        stake_amount: u64,
    }

    struct EventCreatedEvent has drop, store {
        event_id: u64,
        portal_id: u64,
        event_type: u8,
        title: String,
    }

    // Initialize the portal system
    public entry fun initialize(account: &signer) {
        let portal_system = PortalSystem {
            portals: table::new(),
            proposals: table::new(),
            events: table::new(),
            ai_councilors: table::new(),
            next_portal_id: 1,
            next_proposal_id: 1,
            next_event_id: 1,
            portal_created_events: account::new_event_handle<PortalCreatedEvent>(account),
            proposal_created_events: account::new_event_handle<ProposalCreatedEvent>(account),
            vote_cast_events: account::new_event_handle<VoteCastEvent>(account),
            event_created_events: account::new_event_handle<EventCreatedEvent>(account),
        };
        move_to(account, portal_system);
    }

    // Create a new portal (simplified version for testing)
    public entry fun create_portal_simple(
        account: &signer,
        name: String,
        description: String,
        community_voting_power: u8
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        assert!(community_voting_power <= COMMUNITY_VOTING_POWER_MAX, E_INVALID_VOTING_POWER);
        
        // Transfer stake to contract
        let stake_coin = coin::withdraw<AptosCoin>(account, MINIMUM_PORTAL_STAKE);
        coin::deposit(addr, stake_coin); // For now, deposit back to user - in production, deposit to contract
        
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        let portal_id = portal_system.next_portal_id;
        
        // Store name for event before moving the portal
        let portal_name = name;
        
        let portal = Portal {
            id: portal_id,
            name: name,
            description: description,
            owner: addr,
            governors: vector::empty(),
            staked_amount: MINIMUM_PORTAL_STAKE,
            community_voting_power: community_voting_power,
            created_at: timestamp::now_seconds(),
            active: true,
            native_token: option::none(),
        };
        
        table::add(&mut portal_system.portals, portal_id, portal);
        portal_system.next_portal_id = portal_id + 1;
        
        // Emit event
        event::emit_event(&mut portal_system.portal_created_events, PortalCreatedEvent {
            portal_id: portal_id,
            name: portal_name,
            owner: addr,
            stake_amount: MINIMUM_PORTAL_STAKE,
        });
    }

    // Create a new portal
    public entry fun create_portal(
        account: &signer,
        name: String,
        description: String,
        community_voting_power: u8,
        native_token: Option<String>
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        assert!(community_voting_power <= COMMUNITY_VOTING_POWER_MAX, E_INVALID_VOTING_POWER);
        
        // Transfer stake to contract
        let stake_coin = coin::withdraw<AptosCoin>(account, MINIMUM_PORTAL_STAKE);
        coin::deposit(addr, stake_coin); // For now, deposit back to user - in production, deposit to contract
        
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        let portal_id = portal_system.next_portal_id;
        
        // Store name for event before moving the portal
        let portal_name = name;
        
        let portal = Portal {
            id: portal_id,
            name: name,
            description: description,
            owner: addr,
            governors: vector::empty(),
            staked_amount: MINIMUM_PORTAL_STAKE,
            community_voting_power: community_voting_power,
            created_at: timestamp::now_seconds(),
            active: true,
            native_token: native_token,
        };
        
        table::add(&mut portal_system.portals, portal_id, portal);
        portal_system.next_portal_id = portal_id + 1;
        
        // Emit event
        event::emit_event(&mut portal_system.portal_created_events, PortalCreatedEvent {
            portal_id: portal_id,
            name: portal_name,
            owner: addr,
            stake_amount: MINIMUM_PORTAL_STAKE,
        });
    }

    // Add governor to portal
    public entry fun add_governor(
        account: &signer,
        portal_id: u64,
        governor_address: address
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        assert!(table::contains(&portal_system.portals, portal_id), E_PORTAL_NOT_FOUND);
        let portal = table::borrow_mut(&mut portal_system.portals, portal_id);
        
        assert!(portal.owner == addr, E_NOT_AUTHORIZED);
        vector::push_back(&mut portal.governors, governor_address);
    }

    // Create AI Councilor
    public entry fun create_ai_councilor(
        account: &signer,
        name: String,
        risk_tolerance: u8,
        roi_preference: u8,
        community_engagement: u8,
        governance_participation: u8,
        preferred_event_types: vector<u8>,
        min_stake_threshold: u64,
        max_stake_threshold: u64,
        keywords: vector<String>,
        auto_vote_enabled: bool
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        let behavior = AIBehavior {
            risk_tolerance,
            roi_preference,
            community_engagement,
            governance_participation,
            preferred_event_types,
            min_stake_threshold,
            max_stake_threshold,
            keywords,
            auto_vote_enabled,
        };
        
        let ai_councilor = AICounsilor {
            owner: addr,
            name,
            behavior,
            created_at: timestamp::now_seconds(),
            active: true,
        };
        
        if (!table::contains(&portal_system.ai_councilors, addr)) {
            table::add(&mut portal_system.ai_councilors, addr, vector::empty());
        };
        
        let user_councilors = table::borrow_mut(&mut portal_system.ai_councilors, addr);
        vector::push_back(user_councilors, ai_councilor);
    }

    // Create proposal
    public entry fun create_proposal(
        account: &signer,
        portal_id: u64,
        title: String,
        description: String,
        proposal_type: u8,
        option_titles: vector<String>,
        option_descriptions: vector<String>,
        voting_duration_hours: u64,
        min_stake: u64
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        assert!(table::contains(&portal_system.portals, portal_id), E_PORTAL_NOT_FOUND);
        let portal = table::borrow(&portal_system.portals, portal_id);
        
        // Check if user is authorized (owner or governor)
        assert!(portal.owner == addr || vector::contains(&portal.governors, &addr), E_NOT_AUTHORIZED);
        
        let proposal_id = portal_system.next_proposal_id;
        let current_time = timestamp::now_seconds();
        
        // Create proposal options
        let options = vector::empty<ProposalOption>();
        let i = 0;
        while (i < vector::length(&option_titles)) {
            let option = ProposalOption {
                id: (i as u8),
                title: *vector::borrow(&option_titles, i),
                description: *vector::borrow(&option_descriptions, i),
                votes: 0,
                weighted_score: 0,
            };
            vector::push_back(&mut options, option);
            i = i + 1;
        };
        
        // Store title for event before moving the proposal
        let proposal_title = title;
        
        let proposal = Proposal {
            id: proposal_id,
            portal_id,
            title,
            description,
            proposal_type,
            options,
            votes: vector::empty(),
            voting_end_time: current_time + (voting_duration_hours * 3600),
            min_stake,
            total_staked: 0,
            created_by: addr,
            created_at: current_time,
            finalized: false,
            result: option::none(),
        };
        
        table::add(&mut portal_system.proposals, proposal_id, proposal);
        portal_system.next_proposal_id = proposal_id + 1;
        
        // Emit event
        event::emit_event(&mut portal_system.proposal_created_events, ProposalCreatedEvent {
            proposal_id,
            portal_id,
            title: proposal_title,
            created_by: addr,
        });
    }

    // Cast vote on proposal
    public entry fun vote_on_proposal(
        account: &signer,
        proposal_id: u64,
        option_id: u8,
        stake_amount: u64,
        score: u8 // 1-10 scale
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        assert!(table::contains(&portal_system.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut portal_system.proposals, proposal_id);
        
        assert!(timestamp::now_seconds() < proposal.voting_end_time, E_VOTING_ENDED);
        assert!(stake_amount >= proposal.min_stake, E_INSUFFICIENT_STAKE);
        assert!(score >= 1 && score <= 10, E_INVALID_OPTION);
        
        // Check if user already voted
        let i = 0;
        while (i < vector::length(&proposal.votes)) {
            let vote = vector::borrow(&proposal.votes, i);
            assert!(vote.voter != addr, E_ALREADY_VOTED);
            i = i + 1;
        };
        
        // Validate option ID
        assert!((option_id as u64) < vector::length(&proposal.options), E_INVALID_OPTION);
        
        // Transfer stake
        let stake_coin = coin::withdraw<AptosCoin>(account, stake_amount);
        coin::deposit(addr, stake_coin); // For now, deposit back to user
        
        // Create vote record
        let vote = Vote {
            voter: addr,
            option_id,
            stake_amount,
            score,
            timestamp: timestamp::now_seconds(),
        };
        
        // Calculate weighted score (stake_amount * score)
        let weighted_score = stake_amount * (score as u64);
        
        // Update proposal option
        let option = vector::borrow_mut(&mut proposal.options, (option_id as u64));
        option.votes = option.votes + 1;
        option.weighted_score = option.weighted_score + weighted_score;
        
        // Update proposal totals
        proposal.total_staked = proposal.total_staked + stake_amount;
        vector::push_back(&mut proposal.votes, vote);
        
        // Emit event
        event::emit_event(&mut portal_system.vote_cast_events, VoteCastEvent {
            proposal_id,
            voter: addr,
            option_id,
            stake_amount,
        });
    }

    // Create community event
    public entry fun create_community_event(
        account: &signer,
        portal_id: u64,
        event_type: u8,
        title: String,
        description: String,
        start_time: u64,
        end_time: u64,
        requirements: String,
        rewards: String,
        max_participants: u64
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        assert!(table::contains(&portal_system.portals, portal_id), E_PORTAL_NOT_FOUND);
        let portal = table::borrow(&portal_system.portals, portal_id);
        
        assert!(portal.owner == addr || vector::contains(&portal.governors, &addr), E_NOT_AUTHORIZED);
        
        let event_id = portal_system.next_event_id;
        
        // Store title for event before moving the community_event
        let event_title = title;
        
        let community_event = CommunityEvent {
            id: event_id,
            portal_id,
            event_type,
            title,
            description,
            start_time,
            end_time,
            requirements,
            rewards,
            max_participants,
            participants: vector::empty(),
            created_by: addr,
            active: true,
        };
        
        table::add(&mut portal_system.events, event_id, community_event);
        portal_system.next_event_id = event_id + 1;
        
        // Emit event
        event::emit_event(&mut portal_system.event_created_events, EventCreatedEvent {
            event_id,
            portal_id,
            event_type,
            title: event_title,
        });
    }

    // Join community event
    public entry fun join_community_event(
        account: &signer,
        event_id: u64
    ) acquires PortalSystem {
        let addr = signer::address_of(account);
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        assert!(table::contains(&portal_system.events, event_id), E_PROPOSAL_NOT_FOUND);
        let community_event = table::borrow_mut(&mut portal_system.events, event_id);
        
        assert!(community_event.active, E_VOTING_ENDED);
        assert!(vector::length(&community_event.participants) < community_event.max_participants, E_INSUFFICIENT_STAKE);
        
        // Check if already joined
        assert!(!vector::contains(&community_event.participants, &addr), E_ALREADY_VOTED);
        
        vector::push_back(&mut community_event.participants, addr);
    }

    // Finalize proposal (calculate results)
    public entry fun finalize_proposal(
        _account: &signer,
        proposal_id: u64
    ) acquires PortalSystem {
        let portal_system = borrow_global_mut<PortalSystem>(ADMIN_ADDRESS);
        
        assert!(table::contains(&portal_system.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        let proposal = table::borrow_mut(&mut portal_system.proposals, proposal_id);
        
        assert!(timestamp::now_seconds() >= proposal.voting_end_time, E_VOTING_ENDED);
        assert!(!proposal.finalized, E_ALREADY_VOTED);
        
        // Find winning option (highest weighted score)
        let winning_option_id = 0u8;
        let highest_score = 0u64;
        let i = 0;
        
        while (i < vector::length(&proposal.options)) {
            let option = vector::borrow(&proposal.options, i);
            if (option.weighted_score > highest_score) {
                highest_score = option.weighted_score;
                winning_option_id = option.id;
            };
            i = i + 1;
        };
        
        proposal.result = option::some(winning_option_id);
        proposal.finalized = true;
    }

    // View functions
    
    #[view]
    public fun get_portal(portal_id: u64): Portal acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        assert!(table::contains(&portal_system.portals, portal_id), E_PORTAL_NOT_FOUND);
        *table::borrow(&portal_system.portals, portal_id)
    }

    #[view]
    public fun get_proposal(proposal_id: u64): Proposal acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        assert!(table::contains(&portal_system.proposals, proposal_id), E_PROPOSAL_NOT_FOUND);
        *table::borrow(&portal_system.proposals, proposal_id)
    }

    #[view]
    public fun get_user_ai_councilors(user_addr: address): vector<AICounsilor> acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        if (table::contains(&portal_system.ai_councilors, user_addr)) {
            *table::borrow(&portal_system.ai_councilors, user_addr)
        } else {
            vector::empty()
        }
    }

    #[view]
    public fun get_community_event(event_id: u64): CommunityEvent acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        assert!(table::contains(&portal_system.events, event_id), E_PROPOSAL_NOT_FOUND);
        *table::borrow(&portal_system.events, event_id)
    }

    #[view]
    public fun get_active_proposals_for_portal(portal_id: u64): vector<u64> acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        let active_proposals = vector::empty<u64>();
        let i = 1;
        
        while (i < portal_system.next_proposal_id) {
            if (table::contains(&portal_system.proposals, i)) {
                let proposal = table::borrow(&portal_system.proposals, i);
                if (proposal.portal_id == portal_id && 
                    timestamp::now_seconds() < proposal.voting_end_time && 
                    !proposal.finalized) {
                    vector::push_back(&mut active_proposals, i);
                };
            };
            i = i + 1;
        };
        
        active_proposals
    }

    #[view]
    public fun get_active_events_for_portal(portal_id: u64): vector<u64> acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        let active_events = vector::empty<u64>();
        let i = 1;
        
        while (i < portal_system.next_event_id) {
            if (table::contains(&portal_system.events, i)) {
                let community_event = table::borrow(&portal_system.events, i);
                if (community_event.portal_id == portal_id && 
                    community_event.active && 
                    timestamp::now_seconds() < community_event.end_time) {
                    vector::push_back(&mut active_events, i);
                };
            };
            i = i + 1;
        };
        
        active_events
    }

    #[view]
    public fun get_user_voting_power(stake_amount: u64): u64 {
        stake_amount / VOTES_PER_10_APT
    }

    #[view]
    public fun get_all_portals(): vector<u64> acquires PortalSystem {
        let portal_system = borrow_global<PortalSystem>(ADMIN_ADDRESS);
        let all_portals = vector::empty<u64>();
        let i = 1;
        
        while (i < portal_system.next_portal_id) {
            if (table::contains(&portal_system.portals, i)) {
                let portal = table::borrow(&portal_system.portals, i);
                if (portal.active) {
                    vector::push_back(&mut all_portals, i);
                };
            };
            i = i + 1;
        };
        
        all_portals
    }
}