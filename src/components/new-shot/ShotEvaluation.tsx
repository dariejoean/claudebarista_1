
import React from 'react';
import { EvaluationControl } from '../EvaluationControl';
import { TasteConclusionControl } from '../TasteConclusionControl';
import { RatingBox } from '../RatingBox';
import { useEditorStore } from '../../store/editorStore';
import { 
    BOX_STYLE, 
    LABEL_STYLE, 
    VALUE_WRAPPER_STYLE, 
    SECTION_HEADER_STYLE,
    getDynamicSectionHeaderStyle
} from '../../styles/common';
import { TagCategory } from '../../types';

interface ShotEvaluationProps {
    onOpenTagModal: (cat: TagCategory) => void;
}

export const ShotEvaluation: React.FC<ShotEvaluationProps> = React.memo((props) => {
    // Store
    const ratingAspect = useEditorStore(s => s.ratingAspect);
    const setRatingAspect = useEditorStore(s => s.setRatingAspect);
    const ratingAroma = useEditorStore(s => s.ratingAroma);
    const setRatingAroma = useEditorStore(s => s.setRatingAroma);
    const ratingTaste = useEditorStore(s => s.ratingTaste);
    const setRatingTaste = useEditorStore(s => s.setRatingTaste);
    const ratingBody = useEditorStore(s => s.ratingBody);
    const setRatingBody = useEditorStore(s => s.setRatingBody);
    const ratingOverall = useEditorStore(s => s.ratingOverall);
    const setRatingOverall = useEditorStore(s => s.setRatingOverall);
    const notes = useEditorStore(s => s.notes);
    const setNotes = useEditorStore(s => s.setNotes);
    const tasteConclusion = useEditorStore(s => s.tasteConclusion);
    const setTasteConclusion = useEditorStore(s => s.setTasteConclusion);
    const tags = useEditorStore(s => s.tags);

    return (
        <div className="flex flex-col gap-4">
            <div id="section-new-evaluation" className={`${SECTION_HEADER_STYLE} scroll-mt-24`} style={getDynamicSectionHeaderStyle()}>EVALUARE</div>
            
            <div className="flex flex-col gap-4">
                <EvaluationControl 
                    title="ASPECT" 
                    category="aspect"
                    value={ratingAspect} 
                    onChange={setRatingAspect} 
                    onOpenTags={() => props.onOpenTagModal('aspect')}
                    selectedTags={tags['aspect']}
                />
                <EvaluationControl 
                    title="AROMĂ" 
                    category="aroma"
                    value={ratingAroma} 
                    onChange={setRatingAroma} 
                    onOpenTags={() => props.onOpenTagModal('aroma')}
                    selectedTags={tags['aroma']}
                />
                <EvaluationControl 
                    title="GUST" 
                    category="taste"
                    value={ratingTaste} 
                    onChange={setRatingTaste} 
                    onOpenTags={() => props.onOpenTagModal('taste')}
                    selectedTags={tags['taste']}
                />
                <EvaluationControl 
                    title="CORP" 
                    category="body"
                    value={ratingBody} 
                    onChange={setRatingBody} 
                    onOpenTags={() => props.onOpenTagModal('body')}
                    selectedTags={tags['body']}
                />
            </div>

            <div className={BOX_STYLE}>
                <label className={LABEL_STYLE}>OBSERVAȚII</label>
                <div className={VALUE_WRAPPER_STYLE}>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Am oprit pompa mai devreme..."
                        className="w-full h-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none resize-none text-center pt-2 leading-tight font-medium"
                    />
                </div>
            </div>

            {/* NEW: TASTE CONCLUSION BEFORE RATING */}
            <TasteConclusionControl 
                value={tasteConclusion} 
                onChange={setTasteConclusion} 
            />

            <RatingBox title="NOTĂ GENERALĂ" value={ratingOverall} onChange={setRatingOverall} isPremium={true} />
        </div>
    );
});
