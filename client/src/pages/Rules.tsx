import { useState, useEffect } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import './Rules.css';

const Rules = () => {
    const [agreed, setAgreed] = useState(false);
    const [groupInfo, setGroupInfo] = useState<any>(null);

    useEffect(() => {
        const info = localStorage.getItem('group_info');
        if (info) setGroupInfo(JSON.parse(info));
    }, []);

    const handleStart = () => {
        if (agreed) {
            window.location.href = '/quiz';
        }
    };

    return (
        <div className="rules-page">
            <div className="rules-card glass">
                <ShieldCheck size={48} className="icon" />
                <h1>Quiz Rules & Regulations</h1>
                {groupInfo && (
                    <div className="group-welcome">
                        Welcome, <strong>Group: {groupInfo.studentNames.join(', ')}</strong>
                    </div>
                )}

                <div className="rules-list">
                    <div className="rule-item">
                        <Info size={18} className="rule-icon" />
                        <span>Each question has <strong>45 seconds</strong> limit.</span>
                    </div>
                    <div className="rule-item">
                        <Info size={18} className="rule-icon" />
                        <span>No backward navigation once a question is submitted.</span>
                    </div>
                    <div className="rule-item">
                        <Info size={18} className="rule-icon" />
                        <span>Copy–paste is strictly disabled.</span>
                    </div>
                    <div className="rule-item">
                        <Info size={18} className="rule-icon" />
                        <span>Tab switching and window minimization are monitored.</span>
                    </div>
                    <div className="rule-item">
                        <Info size={18} className="rule-icon" />
                        <span><strong>Full-screen mode</strong> is mandatory. Exiting may lead to disqualification.</span>
                    </div>
                </div>

                <div className="agreement">
                    <input
                        type="checkbox"
                        id="agree"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <label htmlFor="agree">I agree to all rules and conditions mentioned above.</label>
                </div>

                <button
                    className="start-button"
                    disabled={!agreed}
                    onClick={handleStart}
                >
                    Enter Full Screen & Start Quiz
                </button>
            </div>
        </div>
    );
};

export default Rules;
