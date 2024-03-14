"use client";

import { useEffect, useState } from "react";

import Head from "next/head";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const saveToLocalStorage = (data) => {
  const prompts = JSON.parse(localStorage.getItem("prompts")) || [];
  prompts.push(data);
  localStorage.setItem("prompts", JSON.stringify(prompts));
};

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [promptsHistory, setPromptsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedPrompts = JSON.parse(localStorage.getItem("prompts")) || [];
    setPromptsHistory(storedPrompts);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const promptValue = e.target.prompt.value;
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: promptValue }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      setError(`Error: ${prediction.detail}`);
      setIsLoading(false);
      return;
    }
    setPrediction(prediction);
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(1000);
      const response = await fetch("/api/predictions/" + prediction.id);
      prediction = await response.json();
      if (response.status !== 200) {
        setError(`Error: ${prediction.detail}`);
        setIsLoading(false);
        return;
      }
      setPrediction(prediction);
    }
    setIsLoading(false);
    saveToLocalStorage({ prompt: promptValue, response: prediction });
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-8">
      <Head>
        <title>Replicate + Next.js</title>
      </Head>
      <p className="text-gray-600 mb-4">
        Made in {">"} 20 Minutes{" "}
        {/* <a href="https://replicate.com/stability-ai/stable-diffusion">SDXL</a>: */}
      </p>
      <form className="flex mb-8" onSubmit={handleSubmit}>
        <input
          type="text"
          name="prompt"
          placeholder="Enter a prompt to display an image"
          className="border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`${
            isLoading
              ? "bg-gray-400 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } rounded-r-md px-4 py-2 font-semibold`}
        >
          {isLoading ? "Loading..." : "Go!"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {prediction && (
        <div className="mb-8">
          {prediction.output && (
            <div className="mb-4">
              <img
                src={prediction.output[prediction.output.length - 1]}
                alt="output"
                className="max-w-full h-auto rounded-md shadow-md"
              />
            </div>
          )}
          <p className="text-gray-600">status: {prediction.status}</p>
        </div>
      )}
      <div className="w-full max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Prompts History</h2>
        <ul>
          {promptsHistory.map((item, index) => (
            <li
              key={index}
              className="border border-gray-300 rounded-md p-4 mb-4 shadow-md"
            >
              <p className="font-semibold">Prompt: {item.prompt}</p>
              {item.response && (
                <div>
                  <p className="text-gray-600">Status: {item.response.status}</p>
                  {item.response.output && (
                    <div className="mt-4">
                      <p className="text-gray-600 mb-2">Output:</p>
                      <img
                        src={
                          item.response.output[item.response.output.length - 1]
                        }
                        alt="output"
                        className="max-w-full h-auto rounded-md shadow-md"
                      />
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}