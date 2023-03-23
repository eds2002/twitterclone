import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
dayjs.extend(relativeTime);

import { api, RouterOutputs } from "~/utils/api";
import LoadingSpinner, { LoadingPage } from "~/components/LoadingSpinner";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import Layout from "~/components/Layout";
import { PostsView } from "~/components/PostView";

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div className="flex flex-col ">
      {data.map((fullPost) => (
        <PostsView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const [input, setInput] = useState("");
  const ctx = api.useContext();

  // Start fetching ASAP
  api.posts.getAll.useQuery();

  // Return empty div is user isnt loaded
  if (!userLoaded) return <div />;

  const CreatePostWizard = () => {
    const { user } = useUser();
    const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
      onSuccess: () => {
        setInput("");
        void ctx.posts.getAll.invalidate();
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast.error(errorMessage[0]);
        } else {
          toast.error("Failed to post! Please try again later");
        }
      },
    });

    if (!user) return null;

    return (
      <div className="flex w-full gap-x-3">
        <Image
          src={user.profileImageUrl}
          className="h-14 w-14 rounded-full"
          alt="My profile image"
          width={56}
          height={56}
        />
        <input
          placeholder="Type some emojis"
          className="w-full bg-transparent outline-none"
          value={input}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (input !== "") {
                mutate({ content: input });
              }
            }
          }}
          onChange={(e) => setInput(e.target.value)}
          disabled={isPosting}
        />
        {input !== "" && !isPosting && (
          <button onClick={() => mutate({ content: input })}>Post</button>
        )}
        {isPosting && (
          <div className="flex items-center justify-center">
            <LoadingSpinner size={20} />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Layout>
        <div className="flex border-b border-slate-400 p-4 ">
          {!isSignedIn && (
            <div className="flex justify-center">
              <SignInButton />
            </div>
          )}
          {!!isSignedIn && <CreatePostWizard />}
        </div>
        <Feed />
      </Layout>
    </>
  );
};

export default Home;
