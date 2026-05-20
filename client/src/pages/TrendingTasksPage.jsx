import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Flame, Zap, Star, Users, Loader, Clock } from 'lucide-react';
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";

export default function TrendingTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, hot, competitive, new, active

  useEffect(() => {
    const fetchTrendingTasks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tasks-advanced/trending?limit=20');
        setTasks(response.data.tasks);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch trending tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingTasks();
  }, []);

  const getTrendBadge = (status) => {
    const badges = {
      HOT: { icon: Flame, color: 'text-red-400', bg: 'bg-red-500/10', label: 'HOT 🔥' },
      COMPETITIVE: { icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'COMPETITIVE ⚡' },
      NEW: { icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'NEW ✨' },
      ACTIVE: { icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'ACTIVE 📈' },
    };
    return badges[status] || badges.ACTIVE;
  };

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(t => t.trend_status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a1f3a] flex items-center justify-center">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a1f3a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Trending Tasks</h1>
          </div>
          <p className="text-gray-400">Discover the most popular and active tasks right now</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['all', 'hot', 'competitive', 'new', 'active'].map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'primary' : 'ghost'}
              className="px-4 py-2 rounded-lg font-medium"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <span className="ml-1 text-xs">({tasks.filter(t => t.trend_status === f.toUpperCase()).length})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task, idx) => {
            const badge = getTrendBadge(task.trend_status);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={task.id}
                className="group bg-gradient-to-br from-[#1a1f3a] to-[#151d2b] border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/50 transition transform hover:scale-105"
              >
                {/* Rank indicator */}
                <div className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-semibold">
                  #{idx + 1}
                </div>

                <div className="p-6">
                  {/* Trend Badge */}
                  <div className={`inline-flex items-center gap-1 ${badge.color} ${badge.bg} px-3 py-1 rounded-full mb-3`}>
                    <BadgeIcon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{badge.label}</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition mb-2 line-clamp-2">
                    {task.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                    {task.description}
                  </p>

                  {/* Creator Info */}
                  <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                    <span>by {task.creator_name}</span>
                    {task.team_name && <span className="text-cyan-400">• {task.team_name}</span>}
                  </div>

                  {/* Task Meta */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-cyan-500/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Budget</span>
                      <span className="text-green-400 font-semibold">${task.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Difficulty</span>
                      <span className={`font-semibold ${
                        task.difficulty === 'BEGINNER' ? 'text-green-400' :
                        task.difficulty === 'INTERMEDIATE' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {task.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-cyan-400">{task.views || 0}</div>
                      <div className="text-xs text-gray-500">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-400">{task.proposal_count || 0}</div>
                      <div className="text-xs text-gray-500">Proposals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">{task.save_count || 0}</div>
                      <div className="text-xs text-gray-500">Saves</div>
                    </div>
                  </div>

                  {/* Trend Score */}
                  {task.trend_score && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">Trend Score</span>
                        <span className="text-sm font-semibold text-cyan-400">{task.trend_score.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${Math.min((task.trend_score / 200) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {task.tech_stack && task.tech_stack.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">Tech Stack</div>
                      <div className="flex flex-wrap gap-1">
                        {task.tech_stack.slice(0, 4).map((tech, i) => (
                          <span key={i} className="text-xs bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded">
                            {tech}
                          </span>
                        ))}
                        {task.tech_stack.length > 4 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{task.tech_stack.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>
                      Deadline: {new Date(task.deadline).toLocaleDateString()}
                    </span>
                  </div>

                  {/* CTA Button */}
                      <Button className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 rounded-lg hover:from-cyan-500/40 hover:to-purple-500/40 transition font-medium">View Task</Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No tasks found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
