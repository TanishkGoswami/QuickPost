import sys
import os
import codecs

with codecs.open('temp_old.jsx', 'r', encoding='utf-16') as f:
    content = f.read()

def get_block(start, end_marker):
    start_idx = content.find(start)
    if start_idx == -1: return ""
    end_idx = content.find(end_marker, start_idx)
    if end_marker == 'function':
        end_idx = content.find('\nfunction', start_idx + 1)
    return content[start_idx:end_idx] if end_idx != -1 else content[start_idx:]

response_types = get_block('const responseTypes = [', '];') + '];\n'
create_node = get_block('function createResponseNode(', 'function')
create_carousel = get_block('function createCarouselItem(', 'function')
response_summary = get_block('function responseSummary(', 'function')
flow_builder = get_block('function ResponseFlowBuilder(', 'function ResponseEditorDialog')
editor_dialog = get_block('function ResponseEditorDialog(', 'export default')

final_code = """import React, { useState, useEffect } from 'react';
import { GripVertical, MessageCircle, Pencil, Plus, Trash2, X, Clock, FileText, Image as ImageIcon, Layers, MousePointer, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function generateId(prefix = 'item') {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

const StepBadge = ({ step }) => <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141413] text-sm font-semibold text-white">{step}</span>;
const EditorInfo = ({ text }) => <span className="hidden"/>;

""" + response_types + create_node + create_carousel + response_summary + flow_builder + editor_dialog + "\nexport { ResponseFlowBuilder };\n"

with open("client/src/features/autodm/ResponseFlowBuilder.jsx", "w", encoding="utf-8") as out:
    out.write(final_code)

print("Done extracting ResponseFlowBuilder")
