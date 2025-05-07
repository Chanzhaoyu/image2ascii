"use client";

import { useState } from "react";

export default function Home() {
  const [ascii, setAscii] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [showOriginal, setShowOriginal] = useState(true);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 创建图片预览URL
    setImagePreview(URL.createObjectURL(file));

    setLoading(true);
    setError("");
    setAscii("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "转换失败");
      }

      if (data.ascii) {
        setAscii(data.ascii);
      } else {
        throw new Error("未能生成ASCII结果");
      }
    } catch (error: any) {
      console.error("Error converting image:", error);
      setError(error.message || "转换过程中发生错误");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAscii = async () => {
    try {
      await navigator.clipboard.writeText(ascii);
      alert("ASCII 已复制到剪贴板！");
    } catch (err) {
      console.error("复制失败:", err);
      alert("复制失败，请手动选择并复制");
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          图片转 ASCII
        </h1>

        <div className="flex flex-col items-center gap-4">
          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
            选择图片
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </label>

          {loading && (
            <div className="text-gray-600 animate-pulse">处理中...</div>
          )}

          {error && (
            <div className="text-red-500 bg-red-50 p-4 rounded-lg w-full text-center">
              {error}
            </div>
          )}

          {(ascii || imagePreview) && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showOriginal ? "隐藏原图" : "显示原图"}
                </button>
                {ascii && (
                  <button
                    onClick={handleCopyAscii}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    复制 ASCII
                  </button>
                )}
              </div>

              <div className="flex justify-center gap-4">
                {showOriginal && imagePreview && (
                  <div className="">
                    <h3 className="text-lg font-semibold mb-2">原图</h3>
                    <img
                      src={imagePreview}
                      alt="Original"
                      className="h-auto rounded-lg shadow-sm"
                    />
                  </div>
                )}

                {ascii && (
                  <div
                    className={`flex-1 ${
                      showOriginal ? "min-w-[50%]" : "w-full"
                    }`}
                  >
                    <h3 className="text-lg font-semibold mb-2">ASCII 结果</h3>
                    <div className="bg-white p-6 rounded-lg shadow-sm overflow-x-auto">
                      <pre className="font-mono text-xs whitespace-pre select-all">
                        {ascii}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
