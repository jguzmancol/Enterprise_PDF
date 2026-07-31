import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { protectFile, unlockFile } from "../../api/client";
import FileCard from "../FileCard";
import FileDropzone from "../FileDropzone";
function ProtectView({ files, onUpload, error, useSharedFiles, onApiError, onTabLoadingChange, onTabDownloadIdChange }, ref) {
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState("protect");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [allowPrint, setAllowPrint] = useState(true);
    const [allowCopy, setAllowCopy] = useState(true);
    const [allowModify, setAllowModify] = useState(true);
    const selected = files.find((f) => f.id === selectedId);
    useEffect(() => {
        if (files.length > 0) {
            if (!selectedId || !files.find((f) => f.id === selectedId)) {
                setSelectedId(files[0].id);
            }
        }
    }, [files, selectedId]);
    const handleProtect = async () => {
        if (!selectedId)
            return;
        if (mode === "protect") {
            if (password.length < 4) {
                alert("Password must be at least 4 characters");
                return;
            }
            if (password !== confirm) {
                alert("Passwords do not match");
                return;
            }
        }
        else if (!password) {
            alert("Enter the file password");
            return;
        }
        setLoading(true);
        onTabLoadingChange?.(true);
        onTabDownloadIdChange?.(null);
        try {
            const result = mode === "protect"
                ? await protectFile(selectedId, {
                    password,
                    allow_print: allowPrint,
                    allow_copy: allowCopy,
                    allow_modify: allowModify,
                })
                : await unlockFile(selectedId, password);
            onTabDownloadIdChange?.(result.download_id);
        }
        catch (e) {
            if (onApiError?.(e))
                return;
            alert(e instanceof Error ? e.message : "Operation failed");
        }
        finally {
            setLoading(false);
            onTabLoadingChange?.(false);
        }
    };
    useImperativeHandle(ref, () => ({
        action: handleProtect,
        reset: () => { setSelectedId(null); setPassword(""); setConfirm(""); },
        hasPages: selected != null && password.length > 0,
        loading,
    }), [selected, password, loading, handleProtect]);
    if (files.length === 0) {
        return (_jsxs("div", { children: [!useSharedFiles && onUpload && (_jsxs("div", { className: "mb-4", children: [_jsx(FileDropzone, { onUpload: onUpload, multiple: false }), error && (_jsx("div", { className: "mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm", children: error }))] })), _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: "Upload a PDF to protect it with a password or remove its password." })] }));
    }
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-3 dark:text-gray-100", children: "Password Protection" }), !selected ? (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-3", children: "Select a file:" }), _jsx("div", { className: "space-y-2", children: files.map((f) => (_jsx("div", { onClick: () => setSelectedId(f.id), className: "cursor-pointer", children: _jsx(FileCard, { file: f }) }, f.id))) })] })) : (_jsxs("div", { children: [_jsx("div", { className: "mb-4", children: _jsx(FileCard, { file: selected, selected: true }) }), _jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("button", { onClick: () => { setMode("protect"); setPassword(""); setConfirm(""); }, className: `px-4 py-2 text-sm rounded-lg border transition-colors ${mode === "protect"
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: "Protect" }), _jsx("button", { onClick: () => { setMode("unlock"); setPassword(""); setConfirm(""); }, className: `px-4 py-2 text-sm rounded-lg border transition-colors ${mode === "unlock"
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "border-gray-300 dark:border-gray-600 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-500"}`, children: "Unlock" })] }), _jsxs("div", { className: "space-y-4 max-w-md", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-500 dark:text-gray-400 mb-1", children: mode === "protect" ? "Password" : "File password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" })] }), mode === "protect" ? (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-gray-500 dark:text-gray-400 mb-1", children: "Confirm password" }), _jsx("input", { type: "password", value: confirm, onChange: (e) => setConfirm(e.target.value), className: "w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "block text-sm text-gray-500 dark:text-gray-400", children: "Allowed permissions" }), [
                                                { v: allowPrint, set: setAllowPrint, label: "Printing" },
                                                { v: allowCopy, set: setAllowCopy, label: "Copying content" },
                                                { v: allowModify, set: setAllowModify, label: "Modifying / annotating" },
                                            ].map((perm) => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: perm.v, onChange: (e) => perm.set(e.target.checked), className: "w-4 h-4 accent-blue-600" }), _jsx("span", { className: "text-sm text-gray-700 dark:text-gray-200", children: perm.label })] }, perm.label)))] })] })) : (_jsx("p", { className: "text-sm text-gray-400 dark:text-gray-500", children: "The result is a PDF without password protection." }))] })] }))] }));
}
export default forwardRef(ProtectView);
