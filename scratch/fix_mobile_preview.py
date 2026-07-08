file1 = "client/src/pages/auto-dm/MobilePreview.jsx"
with open(file1, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    """              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-tight">
                  <span className="font-bold">{username}</span> <span className="text-white/45">Now</span>""",
    """          <div className="flex gap-2.5">
            <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white">
              <span className="h-2.5 w-2.5 rounded-full bg-[#dedede]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-tight">
                <span className="font-bold">Username</span> <span className="text-white/45">Now</span>
              </p>
              <p className="text-[11px] font-bold leading-tight">Leaves a comment: {triggerKeyword}</p>
              <p className="mt-1 text-[11px] font-bold text-white/45">Reply</p>
            </div>
            <Heart className="mt-1 h-4 w-4 text-white/45" />
          </div>
          {commentReplyEnabled ? (
            <div className="mt-4 flex gap-2.5 pl-7">
              <Avatar src={avatar} username={username} className="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-tight">
                  <span className="font-bold">{username}</span> <span className="text-white/45">Now</span>"""
)

with open(file1, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed MobilePreview")
