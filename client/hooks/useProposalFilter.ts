import { UserDAOEcosystem } from "../types/dao";

interface FilteredProposalData {
  daos: {
    dao_info: {
      id: string;
      name: string;
    };
    proposals: {
      id: string;
      title: string;
      description: string;
      state: number;
      yes_votes: string;
      no_votes: string;
      abstain_votes: string;
      user_voted: boolean;
      user_vote: number | null;
    }[];
  }[];
  total_proposals_created: string;
  total_votes_cast: string;
}

export const useProposalFilter = () => {
  const filterProposalData = (ecosystemData: UserDAOEcosystem): FilteredProposalData => {
    if (!ecosystemData) return {
      daos: [],
      total_proposals_created: "0",
      total_votes_cast: "0"
    };

    return {
      daos: ecosystemData.daos.map(dao => ({
        dao_info: {
          id: dao.dao_info.id.toString(),
          name: dao.dao_info.name
        },
        proposals: dao.proposals.map(proposal => ({
          id: proposal.id.toString(),
          title: proposal.title,
          description: proposal.description,
          state: proposal.state,
          yes_votes: proposal.yes_votes,
          no_votes: proposal.no_votes,
          abstain_votes: proposal.abstain_votes,
          user_voted: proposal.user_voted,
          user_vote: proposal.user_vote
        }))
      })),
      total_proposals_created: ecosystemData.total_proposals_created.toString(),
      total_votes_cast: ecosystemData.total_votes_cast.toString()
    };
  };

  return { filterProposalData };
}; 