import React, { useState } from 'react';
import {
  Bookmark,
  Camera,
  ChevronLeft,
  Grid3X3,
  Heart,
  Home,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Phone,
  PlusCircle,
  Search,
  Send,
  Smile,
  Video,
  Wifi,
} from 'lucide-react';
import { useAutoDM } from '../../context/AutoDMContext';

function EmptyPostMedia() {
  return (
    <div className="grid h-full w-full place-items-center bg-[#0c0c0c]">
      <div className="grid h-14 w-14 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-white/25">
        <ImageIcon className="h-6 w-6" />
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative z-30 flex h-[30px] items-center justify-between px-[28px] pt-2 text-[12px] font-bold text-white">
      <span>12:40</span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-0.5">
          <span className="h-1.5 w-1 rounded-sm bg-white" />
          <span className="h-2 w-1 rounded-sm bg-white" />
          <span className="h-2.5 w-1 rounded-sm bg-white" />
          <span className="h-3 w-1 rounded-sm bg-white" />
        </div>
        <Wifi className="h-3.5 w-3.5" />
        <span className="relative h-2.5 w-4 rounded-[2px] border border-white">
          <span className="absolute inset-[1px] rounded-[1px] bg-white" />
        </span>
      </div>
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[560px] w-[280px] overflow-hidden rounded-[38px] border-[8px] border-[#15202c] bg-[#111] shadow-[0_26px_58px_rgba(17,24,39,0.24)]">
        <div className="absolute left-1/2 top-[14px] z-40 h-[7px] w-[52px] -translate-x-1/2 rounded-full bg-[#2a2a2c]" />
        <StatusBar />
        <div className="absolute inset-x-0 bottom-0 top-[30px]">{children}</div>
      </div>
    </div>
  );
}

function Avatar({ src, username, className = 'h-7 w-7' }) {
  if (!src) {
    return (
      <span
        className={`${className} grid place-items-center rounded-full border border-white/10 bg-[#2a2a2a] text-[10px] font-bold uppercase text-white`}
      >
        {username?.[0] || '?'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={username}
      className={`${className} rounded-full border border-white/10 object-cover`}
    />
  );
}

export default function MobilePreview({ selectedMedia, keywords, responseFlow, commentReplyText, commentReplyEnabled }) {
  const { activeAccount } = useAutoDM();
  const [activeTab, setActiveTab] = useState('DM');

  const username = activeAccount?.username || 'cricboss121';
  const avatar = activeAccount?.profile_picture_url || '';
  const triggerKeyword = keywords?.[0] || 'link';
  const openingMessage =
    responseFlow?.opening_message ||
    "Hey there! I'm so happy you're here,\nthanks so much for your interest \uD83D\uDE0A\n\nClick below and I'll send you the link in\njust a sec \u2728";
  const openingButton = responseFlow?.opening_button || 'Send me the link';
  const selectedMediaSrc = selectedMedia?.thumbnail_url || selectedMedia?.media_url || '';
  const selectedCaption = selectedMedia?.caption || '';

  const renderFlowNode = (node, index) => {
    const nodeType = String(node?.type || 'text').toLowerCase();
    const buttons = Array.isArray(node?.buttons) ? node.buttons : [];

    if (nodeType === 'delay') {
      return (
        <div key={node.id || index} className="ml-7 text-[10px] font-semibold text-white/35">
          Wait {node.delay_seconds || 5}s
        </div>
      );
    }

    return (
      <div key={node.id || index} className="mt-2 flex w-full flex-col items-start gap-1">
        <div className="flex w-full items-start gap-2">
          <Avatar src={avatar} username={username} className="mt-1 h-5 w-5" />
          <div className="max-w-[205px] overflow-hidden rounded-[10px] bg-[#282828] text-[12px] font-semibold text-white">
            {nodeType === 'image' ? (
              <>
                {node.image_url ? (
                  <img src={node.image_url} alt="" className="h-[150px] w-[190px] object-cover" />
                ) : (
                  <div className="grid h-[120px] w-[180px] place-items-center bg-[#1f1f1f] text-[10px] text-white/35">
                    Image
                  </div>
                )}
                {node.content ? <p className="whitespace-pre-wrap px-3 py-2">{node.content}</p> : null}
              </>
            ) : nodeType === 'card' ? (
              <>
                {node.card_image_url ? <img src={node.card_image_url} alt="" className="h-[110px] w-[190px] object-cover" /> : null}
                <div className="space-y-1 px-3 py-2">
                  <p className="font-bold">{node.card_title || 'Card title'}</p>
                  <p className="text-white/65">{node.card_subtitle || 'Card subtitle'}</p>
                </div>
              </>
            ) : nodeType === 'lead_form' ? (
              <div className="space-y-1 px-3 py-2">
                <p className="font-bold">{node.form_title || 'Lead form'}</p>
                <p className="text-white/55">Form fields will appear here.</p>
              </div>
            ) : nodeType === 'carousel' ? (
              <div className="space-y-1 px-3 py-2">
                <p className="font-bold">Carousel</p>
                <p className="text-white/55">{node.items?.length || 1} item(s)</p>
              </div>
            ) : (
              <div className="whitespace-pre-wrap px-3 py-2">
                {node.content || 'Write a message'}
              </div>
            )}
          </div>
        </div>

        {buttons.length > 0 ? (
          <div className="ml-7 flex w-full max-w-[205px] flex-col gap-1">
            {buttons.map((btn, btnIdx) => (
              <div key={btn.id || btnIdx} className="rounded-md bg-[#3a3a3a] px-3 py-2 text-center text-[12px] font-bold text-white">
                {btn.title || 'Button'}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderPost = () => (
    <div className="flex h-full flex-col bg-[#101010] text-white">
      <div className="border-b border-white/[0.06] px-3 pb-2">
        <div className="relative flex items-center justify-center">
          <ChevronLeft className="absolute left-0 h-5 w-5 text-white/80" />
          <div className="text-center leading-none">
            <p className="text-[10px] font-bold uppercase text-white/28">{username}</p>
            <p className="mt-1 text-[15px] font-extrabold">Posts</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <Avatar src={avatar} username={username} className="h-7 w-7" />
          <span className="text-[12px] font-bold">{username}</span>
        </div>
        <MoreHorizontal className="h-5 w-5" />
      </div>
      <div className="h-[235px] w-full bg-[#070707]">
        {selectedMediaSrc ? (
          <img
            src={selectedMediaSrc}
            alt={selectedMedia.caption || 'Instagram post'}
            className="h-full w-full object-cover"
          />
        ) : (
          <EmptyPostMedia />
        )}
      </div>
      <div className="px-3 py-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
          </div>
          <Bookmark className="h-5 w-5" />
        </div>
        {selectedMedia ? (
          <>
            <p className="text-[12px] font-bold">{selectedMedia.like_count || 0} likes</p>
            {selectedCaption ? (
              <p className="mt-1 text-[12px] leading-snug">
                <span className="font-bold">{username}</span> {selectedCaption}
              </p>
            ) : null}
            <p className="mt-1 text-[11px] text-white/35">View all comments</p>
            <p className="mt-1 text-[10px] text-white/28">24 Jun, 2026</p>
          </>
        ) : null}
      </div>
      <div className="mt-auto grid h-[46px] grid-cols-5 items-center border-t border-white/[0.04] px-6 text-white">
        <Home className="h-5 w-5 fill-white" />
        <Search className="h-5 w-5" />
        <PlusCircle className="h-5 w-5" />
        <Grid3X3 className="h-5 w-5" />
        <Avatar src={avatar} username={username} className="h-6 w-6" />
      </div>
    </div>
  );

  const renderComments = () => (
    <div className="relative h-full overflow-hidden bg-[#101010] text-white">
      <div className="absolute inset-x-0 top-0 h-[250px] opacity-80">
        {selectedMediaSrc ? (
          <img
            src={selectedMediaSrc}
            alt={selectedMedia?.caption || 'Instagram post'}
            className="h-full w-full object-cover"
          />
        ) : (
          <EmptyPostMedia />
        )}
      </div>
      <div className="absolute inset-x-0 top-0 z-10 border-b border-white/[0.06] bg-black/25 px-3 pb-2">
        <div className="relative flex items-center justify-center">
          <ChevronLeft className="absolute left-0 h-5 w-5 text-white/80" />
          <div className="text-center leading-none">
            <p className="text-[10px] font-bold uppercase text-white/28">{username}</p>
            <p className="mt-1 text-[15px] font-extrabold">Posts</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[375px] rounded-t-[22px] bg-[#282828] shadow-[0_-16px_45px_rgba(0,0,0,0.42)]">
        <div className="relative flex h-[52px] items-center justify-center border-b border-white/10">
          <span className="absolute top-12 left-1/2 h-1 w-8 -translate-x-1/2 -translate-y-10 rounded-full bg-white/60" />
          <span className="text-[14px] font-extrabold">Comments</span>
          <Send className="absolute right-4 h-5 w-5" />
        </div>
        <div className="px-4 pt-4">
          <div className="flex gap-2.5">
            <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white">
              <span className="h-2.5 w-2.5 rounded-full bg-[#dedede]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] leading-tight">
                <span className="font-bold">Username</span> <span className="text-white/45">Now</span>
              </p>
              <p className="text-[11px] font-bold leading-tight">{triggerKeyword}</p>
              <p className="mt-1 text-[11px] font-bold text-white/45">Reply</p>
            </div>
            <Heart className="mt-1 h-4 w-4 text-white/45" />
          </div>
          {commentReplyEnabled ? (
            <div className="mt-4 flex gap-2.5 pl-7">
              <Avatar src={avatar} username={username} className="h-5 w-5" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-tight">
                  <span className="font-bold">{username}</span> <span className="text-white/45">Now</span>
                </p>
                <p className="text-[11px] font-bold leading-tight">{commentReplyText || 'Check your DM'}</p>
                <p className="mt-1 text-[11px] font-bold text-white/45">Reply</p>
              </div>
              <Heart className="mt-1 h-4 w-4 text-white/45" />
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-[52px] left-3 right-3 flex justify-between text-[22px]">
          {['\u2764\uFE0F', '\uD83D\uDE4C', '\uD83D\uDD25', '\uD83D\uDC4F', '\uD83D\uDE22', '\uD83D\uDE0D', '\uD83D\uDE2E', '\uD83D\uDE02'].map((emoji) => (
            <span key={emoji}>{emoji}</span>
          ))}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
          <Avatar src={avatar} username={username} className="h-8 w-8" />
          <div className="flex h-9 flex-1 items-center rounded-full border border-white/10 px-3 text-[11px] text-white/35">
            Add a comment for username...
          </div>
        </div>
      </div>
    </div>
  );

  const renderDM = () => (
    <div className="flex h-full flex-col bg-[#151515] text-white">
      <div className="flex h-[50px] items-center justify-between border-b border-white/10 px-3">
        <div className="flex items-center gap-2">
          <ChevronLeft className="h-5 w-5" />
          <Avatar src={avatar} username={username} className="h-8 w-8" />
          <span className="text-[13px] font-extrabold">{username}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5" />
          <Video className="h-5 w-5" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-3 py-4">
        <div className="flex max-w-[230px] items-end gap-2">
          <Avatar src={avatar} username={username} className="h-5 w-5" />
          <div className="rounded-[9px] border border-white/8 bg-[#262626] p-2">
            <p className="whitespace-pre-line text-[12px] font-bold leading-[1.25]">{openingMessage}</p>
            <div className="mt-2 rounded-md bg-[#3a3a3a] px-3 py-2 text-center text-[12px] font-bold">
              {openingButton}
            </div>
          </div>
        </div>
        <div className="ml-auto rounded-[14px] rounded-tr-md bg-[#7357f6] px-3 py-2 text-[12px] font-bold">
          {openingButton}
        </div>
        {(!responseFlow?.nodes || !Array.isArray(responseFlow.nodes) || responseFlow.nodes.length === 0) ? (
            <div className="mt-4 flex items-center gap-2">
              <Avatar src={avatar} username={username} className="h-5 w-5" />
              <div className="rounded-[10px] bg-[#282828] px-3 py-2 text-[12px] font-semibold text-white/55">
                Write a message
              </div>
            </div>
          ) : (
            responseFlow.nodes.map(renderFlowNode)
          )}
      </div>
      <div className="px-3 pb-4">
        <div className="flex h-10 items-center rounded-full bg-[#181818] px-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1683dd]">
            <Camera className="h-4 w-4" />
          </span>
          <span className="ml-3 flex-1 text-[13px] text-white/35">Message...</span>
          <div className="flex items-center gap-2 text-white/85">
            <ImageIcon className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Smile className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <PhoneFrame>
        {activeTab === 'Post' ? renderPost() : null}
        {activeTab === 'Comments' ? renderComments() : null}
        {activeTab === 'DM' ? renderDM() : null}
      </PhoneFrame>
      <div className="mt-3 flex h-8 items-center rounded-full bg-[#e8e8e8] p-1 text-[12px] font-semibold text-[#7d7d7d]">
        {['Post', 'Comments', 'DM'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`h-6 min-w-[62px] rounded-full px-3 transition ${
              activeTab === tab ? 'bg-white text-[#222] shadow-sm' : ''
            } ${activeTab === 'DM' && tab === 'DM' ? 'ring-2 ring-[#1683dd]' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
