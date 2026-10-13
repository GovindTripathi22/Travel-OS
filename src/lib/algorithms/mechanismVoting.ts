import { MechanismPoll, PollOption } from '@/types';

export interface VotingResult {
  scores: Record<string, number>;
  winner: PollOption;
  explanation: string;
  rankedOptions: { option: PollOption; score: number }[];
}

/**
 * Resolves a Quadratic Voting Poll.
 * Cost function: credits spent = votes^2.
 * Total effective votes = sum of votes across users.
 */
export function resolveQuadraticPoll(poll: MechanismPoll): VotingResult {
  const scores: Record<string, number> = {};
  poll.options.forEach((opt) => {
    scores[opt.id] = 0;
  });

  // poll.userVotes is Record<userId, Record<optionId, number of votes>>
  for (const [, votesMap] of Object.entries(poll.userVotes || {})) {
    if (!votesMap || typeof votesMap !== 'object') continue;
    for (const [optId, votes] of Object.entries(votesMap)) {
      if (typeof votes === 'number') {
        scores[optId] = (scores[optId] || 0) + votes;
      }
    }
  }

  const rankedOptions = poll.options
    .map((opt) => ({ option: opt, score: scores[opt.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const winner = rankedOptions[0].option;
  const runnerUp = rankedOptions[1]?.option;

  const explanation = `Quadratic consensus reached: "${winner.title}" secured the highest cumulative voice commitment (${rankedOptions[0].score} points) across the group${
    runnerUp ? `, surpassing "${runnerUp.title}" (${rankedOptions[1].score} points)` : ''
  }. Mechanism design neutralized loudest-voice bias by requiring exponential credits for disproportionate votes.`;

  return {
    scores,
    winner,
    explanation,
    rankedOptions,
  };
}

/**
 * Resolves a Borda Count Poll.
 * If there are K options, 1st place gets K points, 2nd gets K-1, ..., last gets 1 point.
 */
export function resolveBordaCountPoll(poll: MechanismPoll): VotingResult {
  const k = poll.options.length;
  const scores: Record<string, number> = {};
  poll.options.forEach((opt) => {
    scores[opt.id] = 0;
  });

  // poll.userVotes is Record<userId, string[]> (ordered list of optionIds from 1st to K-th)
  for (const [, ranking] of Object.entries(poll.userVotes || {})) {
    if (!Array.isArray(ranking)) continue;
    ranking.forEach((optId, index) => {
      const points = Math.max(0, k - index);
      scores[optId] = (scores[optId] || 0) + points;
    });
  }

  const rankedOptions = poll.options
    .map((opt) => ({ option: opt, score: scores[opt.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const winner = rankedOptions[0].option;

  const explanation = `Borda Count consensus concluded: "${winner.title}" achieved the highest broad-spectrum group utility (${rankedOptions[0].score} weighted points), minimizing regret for all participants.`;

  return {
    scores,
    winner,
    explanation,
    rankedOptions,
  };
}
