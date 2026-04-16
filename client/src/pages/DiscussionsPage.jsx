import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const initialPost = {
  title: "",
  content: "",
  category: "Web Development",
  tags: "",
};

export default function DiscussionsPage() {
  const { isAuthenticated } = useAuth();

  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [form, setForm] = useState(initialPost);
  const [error, setError] = useState("");

  async function fetchPosts() {
    try {
      const response = await api.get("/posts");
      setPosts(response.data.posts);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load discussions");
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function viewPost(postId) {
    try {
      const response = await api.get(`/posts/${postId}`);
      setSelectedPost(response.data.post);
      setComments(response.data.comments);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to load post");
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();

    try {
      await api.post("/posts", {
        title: form.title,
        content: form.content,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      setForm(initialPost);
      fetchPosts();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to create post");
    }
  }

  async function handleVote(postId, type) {
    try {
      await api.post(`/posts/${postId}/vote`, { type });
      fetchPosts();
      if (selectedPost && selectedPost.id === postId) {
        viewPost(postId);
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to vote");
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    if (!selectedPost) return;

    try {
      await api.post(`/posts/${selectedPost.id}/comments`, { content: newComment });
      setNewComment("");
      viewPost(selectedPost.id);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to add comment");
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr] fade-in">
      <div className="space-y-4">
        {isAuthenticated && (
          <form onSubmit={handleCreatePost} className="card space-y-3">
            <h2 className="text-lg font-semibold">Create Discussion</h2>
            <input
              className="input"
              placeholder="Title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <textarea
              className="input min-h-24"
              placeholder="Content"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                placeholder="Category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
              />
            </div>
            <button className="btn-primary">Publish Post</button>
          </form>
        )}

        <div className="space-y-3">
          {posts.map((post) => (
            <article key={post.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{post.title}</h3>
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-1">{post.category}</span>
              </div>
              <p className="text-sm text-ink/75 mt-2 line-clamp-2">{post.content}</p>
              <p className="text-xs text-ink/60 mt-2">By {post.author_name}</p>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button className="btn-secondary" onClick={() => viewPost(post.id)}>
                  Open Thread
                </button>
                {isAuthenticated && (
                  <>
                    <button className="btn-secondary" onClick={() => handleVote(post.id, "UP")}>Upvote</button>
                    <button className="btn-secondary" onClick={() => handleVote(post.id, "DOWN")}>Downvote</button>
                  </>
                )}
                <span className="text-xs text-ink/60">Score: {post.score}</span>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="card h-fit">
        <h2 className="text-lg font-semibold">Thread Detail</h2>
        {!selectedPost ? (
          <p className="text-sm text-ink/70 mt-3">Select a post to read comments.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <h3 className="font-semibold">{selectedPost.title}</h3>
            <p className="text-sm text-ink/80">{selectedPost.content}</p>
            <div className="space-y-2 pt-2 border-t border-ink/10">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-gray-50 border border-ink/10 p-3">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-ink/60 mt-1">{comment.author_name}</p>
                </div>
              ))}
            </div>

            {isAuthenticated && (
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  className="input min-h-20"
                  placeholder="Add comment"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  required
                />
                <button className="btn-primary">Comment</button>
              </form>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </aside>
    </section>
  );
}
