import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Download, Save, BookOpen, Heart, Image, FileText, Globe, FileCode, Baby, Sun } from 'lucide-react';
import jsPDF from 'jspdf';

const StoryWizardApp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [storyData, setStoryData] = useState({
    storyType: '', // children, moral, general
    genre: '',
    customGenre: '',
    mainCharacter: '',
    characterDetails: {
      name: '',
      age: '',
      ethnicity: '',
      appearance: '',
      personality: ''
    },
    setting: '',
    customSetting: '',
    environmentDetails: '',
    plotElements: [],
    customPlotElements: '',
    tone: '',
    bookSize: 'short', // short, medium, long
    chapters: 3,
    wordsPerChapter: 500,
    totalWords: 1500,
    generateImages: true, // Toggle for image generation
    imageOrientation: 'square', // square, landscape
    imageSize: '1024x1024', // will be computed based on orientation
    imageStyle: 'colorful', // colorful, blackwhite, pencil, watercolor, cartoon
    imageQuality: 'standard', // standard, hd
    pdfPageSize: 'letter', // letter, a4, a5
    generatedStory: null,
    generatedImages: [],
    generatedChapters: [],
    chapterSummaries: [] // Store summaries for continuity
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [savedStories, setSavedStories] = useState([]);
  const [showSavedStories, setShowSavedStories] = useState(false);

  // Load saved stories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedStories');
    if (saved) {
      setSavedStories(JSON.parse(saved));
    }
    const savedApiKey = localStorage.getItem('openaiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Update total words when book size or chapters change
  useEffect(() => {
    const wordsPerChapter = {
      'short': 500,
      'medium': 1000,
      'long': 2000
    };
    const words = wordsPerChapter[storyData.bookSize];
    setStoryData(prev => ({
      ...prev,
      wordsPerChapter: words,
      totalWords: words * prev.chapters
    }));
  }, [storyData.bookSize, storyData.chapters]);

  const storyTypes = [
    { id: 'children', name: 'Children\'s Story', icon: Baby, description: 'Fun and educational stories for kids' },
    { id: 'moral', name: 'Moral Story', icon: Heart, description: 'Stories with valuable life lessons' },
    { id: 'general', name: 'General Story', icon: BookOpen, description: 'Stories for all audiences' }
  ];

  const genresByType = {
    children: [
      'Adventure', 'Animal Friends', 'Fairy Tale', 'Educational', 
      'Friendship', 'Family', 'School Stories', 'Bedtime Stories', 'Custom'
    ],
    moral: [
      'Kindness & Compassion', 'Honesty & Truth', 'Courage & Bravery', 
      'Friendship & Loyalty', 'Hard Work & Perseverance', 'Gratitude & Appreciation',
      'Respect & Responsibility', 'Sharing & Generosity', 'Custom'
    ],
    general: [
      'Adventure', 'Science Fiction', 'Mystery', 'Historical Fiction', 
      'Contemporary Drama', 'Comedy', 'Romance', 'Custom'
    ]
  };

  const settingsByType = {
    children: [
      'Friendly Forest', 'Cozy Town', 'School', 'Playground',
      'Farm', 'Beach', 'Garden', 'Zoo', 'Custom'
    ],
    moral: [
      'Village', 'School', 'Home', 'Community Center',
      'Park', 'Neighborhood', 'Marketplace', 'Farm', 'Custom'
    ],
    general: [
      'Modern City', 'Small Town', 'Historical Setting', 'Countryside',
      'Beach Town', 'Mountain Village', 'Suburban Neighborhood', 'Custom'
    ]
  };

  const plotElementsByType = {
    children: [
      'Making new friends', 'Learning something new', 'Going on an adventure',
      'Helping others', 'Solving a problem', 'Celebrating together',
      'Discovering talents', 'Overcoming fears'
    ],
    moral: [
      'Learning from mistakes', 'Helping someone in need', 'Standing up for what\'s right',
      'The value of hard work', 'Importance of honesty', 'Power of kindness',
      'Learning to share', 'Respecting differences'
    ],
    general: [
      'Personal growth journey', 'Solving a mystery', 'Overcoming challenges',
      'Building relationships', 'Achieving goals', 'Community involvement',
      'Career development', 'Family dynamics'
    ]
  };

  const tonesByType = {
    children: ['Playful and fun', 'Gentle and soothing', 'Exciting and adventurous', 'Warm and comforting'],
    moral: ['Inspirational', 'Thoughtful', 'Uplifting', 'Encouraging'],
    general: ['Lighthearted', 'Dramatic', 'Humorous', 'Inspirational', 'Reflective']
  };

  const bookSizes = [
    { id: 'short', name: 'Short', chapters: '1-3', wordsPerChapter: '~500', description: 'Quick read (500 words/chapter)' },
    { id: 'medium', name: 'Medium', chapters: '3-5', wordsPerChapter: '~1000', description: 'Standard length (1000 words/chapter)' },
    { id: 'long', name: 'Long', chapters: '5-10', wordsPerChapter: '~2000', description: 'Extended story (2000 words/chapter)' }
  ];

  const steps = [
    'API Setup',
    'Story Type',
    'Choose Genre',
    'Create Character',
    'Select Setting',
    'Plot Elements',
    'Story Details',
    'Generate Story'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateStoryInChunks = async () => {
    setIsGenerating(true);
    setGenerationProgress('Preparing to generate your story...');
    
    try {
      const genre = storyData.genre === 'Custom' ? storyData.customGenre : storyData.genre;
      const setting = storyData.setting === 'Custom' ? storyData.customSetting : storyData.setting;
      const storyTypeDesc = storyData.storyType === 'children' ? 'children\'s' : 
                           storyData.storyType === 'moral' ? 'moral/wholesome' : 'general audience';
      
      const chapters = [];
      const images = [];
      const chapterSummaries = [];
      let previousSummary = '';
      
      // Generate each chapter separately to handle token limits
      for (let i = 0; i < storyData.chapters; i++) {
        setGenerationProgress(`Generating Chapter ${i + 1} of ${storyData.chapters}...`);
        
        const continuityContext = i > 0 ? `\n\nPrevious chapter summary: ${previousSummary}\nEnsure this chapter continues naturally from where the previous chapter ended, maintaining character continuity and plot progression.` : '';
        
        const chapterPrompt = `Create Chapter ${i + 1} of a ${storyData.chapters}-chapter ${storyTypeDesc} ${genre} story.
          
          Story Requirements:
          - This is a ${storyTypeDesc} story that should be appropriate and engaging
          - NO magic, witchcraft, wizards, spells, or occult elements
          - Focus on real-world scenarios and relatable characters
          ${storyData.storyType === 'children' ? '- Use simple language appropriate for children' : ''}
          ${storyData.storyType === 'moral' ? '- Include a clear moral lesson or positive message' : ''}
          
          Character: ${storyData.characterDetails.name || storyData.mainCharacter}
          Character Details: Age ${storyData.characterDetails.age}, ${storyData.characterDetails.ethnicity} ethnicity
          Appearance: ${storyData.characterDetails.appearance}
          Personality: ${storyData.characterDetails.personality}
          Setting: ${setting} - ${storyData.environmentDetails}
          Plot Elements: ${storyData.plotElements.join(', ')} ${storyData.customPlotElements}
          Tone: ${storyData.tone}
          ${continuityContext}
          
          Write ONLY Chapter ${i + 1} (approximately ${storyData.wordsPerChapter} words).
          ${i === 0 ? 'Start with an engaging opening that introduces the character and setting.' : 'Continue the story naturally from the previous events.'}
          ${i === storyData.chapters - 1 ? 'Conclude the story with a satisfying ending that resolves all plot threads.' : 'End with a natural transition that sets up the next chapter.'}
          
          Format: Start with "Chapter ${i + 1}: [Chapter Title]" followed by the chapter content.
          
          At the end, add a line that starts with "SUMMARY:" followed by a one-sentence summary of what happened in this chapter.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: chapterPrompt }],
            max_tokens: Math.min(1500, storyData.wordsPerChapter * 2),
            temperature: 0.8
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }

        const fullChapterText = data.choices[0].message.content;
        
        // Extract summary if present
        const summaryMatch = fullChapterText.match(/SUMMARY:\s*(.+)$/);
        if (summaryMatch) {
          previousSummary = summaryMatch[1];
          chapterSummaries.push(previousSummary);
          // Remove summary from chapter text
          chapters.push(fullChapterText.replace(/\nSUMMARY:\s*.+$/, ''));
        } else {
          chapters.push(fullChapterText);
          // Create a basic summary if none provided
          previousSummary = `Chapter ${i + 1} of the story about ${storyData.characterDetails.name || storyData.mainCharacter}`;
          chapterSummaries.push(previousSummary);
        }
        
        // Generate image for each chapter (if enabled)
        if (storyData.generateImages) {
          setGenerationProgress(`Creating illustration for Chapter ${i + 1}...`);
          
          // Extract key scene from the chapter for better image generation
          const chapterContent = data.choices[0].message.content;
          const chapterTitle = chapterContent.match(/Chapter \d+: ([^\n]+)/)?.[1] || '';
          
          // Create a scene-specific prompt based on the chapter content
          const scenePrompt = `Create a scene summary for illustration: Based on this chapter about ${storyData.characterDetails.name || storyData.mainCharacter}, describe the main visual scene in one sentence. Chapter content: ${chapterContent.substring(0, 500)}...`;
          
          try {
            // First, get a scene description from GPT
            const sceneResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: scenePrompt }],
                max_tokens: 100,
                temperature: 0.7
              })
            });
            
            const sceneData = await sceneResponse.json();
            const sceneDescription = sceneData.choices[0].message.content;
            
            // Style descriptions based on selection
            const styleDescriptions = {
              colorful: 'vibrant colorful digital illustration',
              blackwhite: 'detailed black and white illustration, grayscale, no color',
              pencil: 'pencil sketch drawing, graphite art style, hand-drawn look',
              watercolor: 'soft watercolor painting style, artistic brushstrokes',
              cartoon: 'fun cartoon style, bold outlines, simplified shapes',
              realistic: 'photorealistic, highly detailed, lifelike'
            };
            
            // Create DALL-E 3 prompt with scene context and consistent style
            const imagePrompt = `${styleDescriptions[storyData.imageStyle]} for a children's book: ${sceneDescription}. Character: ${storyData.characterDetails.name || storyData.mainCharacter}, ${storyData.characterDetails.ethnicity} ethnicity, ${storyData.characterDetails.appearance}. Setting: ${setting} ${storyData.environmentDetails}. Style requirements: ${styleDescriptions[storyData.imageStyle]}, professional illustration quality, ${storyData.tone} mood, consistent character design. IMPORTANT: No text, letters, or words in the image.`;
            
            console.log('Generating DALL-E 3 image with prompt:', imagePrompt);
            console.log('Requested size:', storyData.imageSize);
            console.log('Quality:', storyData.imageQuality);
            
            const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'dall-e-3',
                prompt: imagePrompt,
                n: 1,
                size: storyData.imageSize,
                quality: storyData.imageQuality,
                style: storyData.imageStyle === 'realistic' ? 'natural' : 'vivid'
              })
            });

            if (!imageResponse.ok) {
              const errorData = await imageResponse.json();
              console.error('DALL-E 3 API error:', errorData);
              
              // Fallback to DALL-E 2 if DALL-E 3 fails
              console.log('Falling back to DALL-E 2...');
              const dalle2Response = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  prompt: imagePrompt.substring(0, 400), // DALL-E 2 has shorter prompt limit
                  n: 1,
                  size: '1024x1024' // DALL-E 2 doesn't support 1792x1024
                })
              });
              
              const dalle2Data = await dalle2Response.json();
              if (dalle2Data.data && dalle2Data.data[0]) {
                images.push(dalle2Data.data[0].url);
                console.log(`Image ${i + 1} generated with DALL-E 2 (fallback)`);
              } else {
                images.push(null);
              }
            } else {
              const imageData = await imageResponse.json();
              console.log('DALL-E 3 response:', imageData);
              console.log('Requested size:', storyData.imageSize);
              console.log('Image URL:', imageData.data?.[0]?.url);
              
              if (imageData.data && imageData.data[0] && imageData.data[0].url) {
                images.push(imageData.data[0].url);
                console.log(`Image ${i + 1} generated successfully with DALL-E 3`);
              } else {
                console.error('No image URL in response');
                images.push(null);
              }
            }
          } catch (imageError) {
            console.error('Image generation error for chapter', i + 1, ':', imageError);
            images.push(null);
          }
        } else {
          images.push(null);
        }
      }

      const fullStory = chapters.join('\n\n');
      
      setStoryData({
        ...storyData,
        generatedStory: fullStory,
        generatedChapters: chapters,
        generatedImages: images,
        chapterSummaries: chapterSummaries
      });
      
      setGenerationProgress('Story generated successfully!');

    } catch (error) {
      alert(`Error generating story: ${error.message}`);
      setGenerationProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStory = () => {
    const storyTypeName = storyTypes.find(t => t.id === storyData.storyType)?.name || 'Story';
    const newStory = {
      id: Date.now(),
      title: `${storyData.characterDetails.name || storyData.mainCharacter}'s ${storyData.genre} ${storyTypeName}`,
      date: new Date().toLocaleDateString(),
      data: storyData
    };
    
    const updatedStories = [...savedStories, newStory];
    setSavedStories(updatedStories);
    localStorage.setItem('savedStories', JSON.stringify(updatedStories));
    alert('Story saved successfully!');
  };

  const loadStory = (story) => {
    setStoryData(story.data);
    setCurrentStep(7);
    setShowSavedStories(false);
  };

  const downloadStory = async (format) => {
    const { generatedStory, generatedImages, generatedChapters, characterDetails, genre, storyType } = storyData;
    const storyTypeName = storyTypes.find(t => t.id === storyType)?.name || 'Story';
    const title = `${characterDetails.name || storyData.mainCharacter}'s ${genre} ${storyTypeName}`;
    
    let content = '';
    
    switch (format) {
      case 'pdf':
        // Page size configurations
        const pageSizes = {
          letter: { width: 215.9, height: 279.4 }, // 8.5" x 11"
          a4: { width: 210, height: 297 },
          a5: { width: 148, height: 210 }
        };
        
        const pageSize = pageSizes[storyData.pdfPageSize] || pageSizes.letter;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pageSize.width, pageSize.height]
        });
        
        let pageNumber = 1;
        
        // Helper function to add page numbers
        const addPageNumber = () => {
          pdf.setFontSize(10);
          pdf.text(`${pageNumber}`, pageSize.width / 2, pageSize.height - 10, { align: 'center' });
          pageNumber++;
        };
        
        // Helper function to load image as base64 with CORS workaround
        const loadImageAsBase64 = async (url) => {
          try {
            // Method 1: Try using fetch with no-cors mode
            try {
              const response = await fetch(url, { mode: 'no-cors' });
              const blob = await response.blob();
              
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } catch (fetchError) {
              console.log('Fetch failed, trying canvas method...');
              
              // Method 2: Use canvas with crossOrigin
              return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = function() {
                  const canvas = document.createElement('canvas');
                  canvas.width = this.naturalWidth;
                  canvas.height = this.naturalHeight;
                  
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(this, 0, 0);
                  
                  try {
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                    resolve(dataUrl);
                  } catch (e) {
                    reject(e);
                  }
                };
                
                img.onerror = function() {
                  // Method 3: If CORS fails, try without crossOrigin
                  const img2 = new Image();
                  
                  img2.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = this.naturalWidth;
                    canvas.height = this.naturalHeight;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(this, 0, 0);
                    
                    try {
                      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
                      resolve(dataUrl);
                    } catch (e) {
                      console.error('Canvas conversion failed:', e);
                      resolve(null);
                    }
                  };
                  
                  img2.onerror = () => {
                    console.error('Image loading failed completely');
                    resolve(null);
                  };
                  
                  img2.src = url;
                };
                
                img.src = url;
              });
            }
          } catch (error) {
            console.error('Error loading image:', error);
            return null;
          }
        };
        
        // Pre-load all images
        const imageDataUrls = [];
        for (let i = 0; i < generatedImages.length; i++) {
          if (generatedImages[i]) {
            const dataUrl = await loadImageAsBase64(generatedImages[i]);
            imageDataUrls.push(dataUrl);
          } else {
            imageDataUrls.push(null);
          }
        }
        
        // Title page - handle long titles with 24 character limit per line
        const titleWords = title.split(' ');
        let titleLines = [];
        let currentLine = '';
        
        titleWords.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          // Break at 24 characters or if the line would be too wide
          if (testLine.length > 24 || pdf.getTextWidth(testLine) > pageSize.width * 0.8) {
            if (currentLine) {
              titleLines.push(currentLine);
              currentLine = word;
            } else {
              // If a single word is longer than 24 chars, split it
              titleLines.push(word.substring(0, 24));
              currentLine = word.substring(24);
            }
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) {
          titleLines.push(currentLine);
        }
        
        pdf.setFontSize(24);
        let titleY = pageSize.height * 0.35;
        titleLines.forEach(line => {
          pdf.text(line, pageSize.width / 2, titleY, { align: 'center' });
          titleY += 12;
        });
        
        pdf.setFontSize(16);
        pdf.text(`A ${storyTypeName}`, pageSize.width / 2, titleY + 20, { align: 'center' });
        
        addPageNumber();
        
        // Extract chapter titles for table of contents
        const chapterTitles = generatedChapters.map((chapter, index) => {
          const match = chapter.match(/Chapter \d+: ([^\n]+)/);
          return match ? match[1] : `Chapter ${index + 1}`;
        });
        
        // Table of Contents
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text('Table of Contents', pageSize.width / 2, 30, { align: 'center' });
        pdf.setFont(undefined, 'normal');
        
        let tocY = 50;
        pdf.setFontSize(12);
        chapterTitles.forEach((title, index) => {
          const chapterLine = `Chapter ${index + 1}: ${title}`;
          const pageNum = `${index + 3}`;
          
          // Truncate long chapter titles
          const maxWidth = pageSize.width * 0.7;
          let displayTitle = chapterLine;
          if (pdf.getTextWidth(chapterLine) > maxWidth) {
            while (pdf.getTextWidth(displayTitle + '...') > maxWidth) {
              displayTitle = displayTitle.substring(0, displayTitle.length - 1);
            }
            displayTitle += '...';
          }
          
          pdf.text(displayTitle, pageSize.width * 0.15, tocY);
          pdf.text(pageNum, pageSize.width * 0.85, tocY, { align: 'right' });
          
          tocY += 8;
        });
        
        addPageNumber();
        
        // Add each chapter starting on a new page
        for (let i = 0; i < generatedChapters.length; i++) {
          pdf.addPage();
          let yPosition = 25;
          
          // Extract chapter title
          const chapterMatch = generatedChapters[i].match(/Chapter \d+: ([^\n]+)/);
          const chapterTitle = chapterMatch ? chapterMatch[1] : `Chapter ${i + 1}`;
          
          // Chapter header
          pdf.setFontSize(18);
          pdf.setFont(undefined, 'bold');
          pdf.text(`Chapter ${i + 1}`, pageSize.width / 2, yPosition, { align: 'center' });
          yPosition += 10;
          
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'normal');
          
          // Handle long chapter titles with 30 character limit
          const chapterTitleWords = chapterTitle.split(' ');
          let chapterTitleLines = [];
          let currentTitleLine = '';
          
          chapterTitleWords.forEach(word => {
            const testLine = currentTitleLine + (currentTitleLine ? ' ' : '') + word;
            if (testLine.length > 30 || pdf.getTextWidth(testLine) > pageSize.width * 0.8) {
              if (currentTitleLine) {
                chapterTitleLines.push(currentTitleLine);
                currentTitleLine = word;
              } else {
                chapterTitleLines.push(word.substring(0, 30));
                currentTitleLine = word.substring(30);
              }
            } else {
              currentTitleLine = testLine;
            }
          });
          if (currentTitleLine) {
            chapterTitleLines.push(currentTitleLine);
          }
          
          chapterTitleLines.forEach(line => {
            pdf.text(line, pageSize.width / 2, yPosition, { align: 'center' });
            yPosition += 6;
          });
          
          yPosition += 10;
          
          // Add image if available
          if (imageDataUrls[i]) {
            try {
              if (imageDataUrls[i] && imageDataUrls[i].startsWith('data:')) {
                // Calculate image dimensions
                const maxImgWidth = pageSize.width * 0.8;
                const maxImgHeight = pageSize.height * 0.4;
                
                let imgWidth, imgHeight;
                if (storyData.imageOrientation === 'landscape') {
                  imgWidth = maxImgWidth;
                  imgHeight = imgWidth * (9 / 16); // 16:9 ratio
                } else {
                  imgWidth = Math.min(maxImgWidth * 0.7, maxImgHeight);
                  imgHeight = imgWidth; // 1:1 ratio
                }
                
                // Center the image
                const xPos = (pageSize.width - imgWidth) / 2;
                
                pdf.addImage(imageDataUrls[i], 'JPEG', xPos, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 10;
              } else {
                // If image couldn't be loaded due to CORS, add a placeholder
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'italic');
                pdf.text('[Image could not be embedded due to browser security. See HTML version for images.]', pageSize.width / 2, yPosition, { align: 'center' });
                yPosition += 15;
                pdf.setFont(undefined, 'normal');
              }
            } catch (e) {
              console.error('Error adding image to PDF:', e);
            }
          }
          
          // Add chapter text
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'normal');
          const chapterText = generatedChapters[i].replace(/Chapter \d+: [^\n]+\n/, '');
          const lines = pdf.splitTextToSize(chapterText, pageSize.width * 0.8);
          
          const leftMargin = pageSize.width * 0.1;
          const bottomMargin = pageSize.height - 20;
          
          // Start new pages as needed for the text
          for (const line of lines) {
            if (yPosition > bottomMargin) {
              addPageNumber();
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, leftMargin, yPosition);
            yPosition += 5;
          }
          
          // Add page number for the last page of the chapter
          addPageNumber();
        }
        
        pdf.save(`${title}.pdf`);
        break;
        
      case 'html':
        content = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${title}</title>
            <style>
              @media print {
                .chapter { page-break-before: always; }
                .page-number { 
                  position: fixed;
                  bottom: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                }
                .toc { page-break-after: always; }
              }
              body { 
                font-family: Georgia, serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 40px 20px;
                line-height: 1.8;
                color: #333;
              }
              h1 { 
                color: #2c3e50; 
                text-align: center;
                margin-bottom: 10px;
                font-size: 2.5em;
              }
              .subtitle {
                text-align: center;
                color: #7f8c8d;
                margin-bottom: 50px;
                font-size: 1.2em;
              }
              .toc {
                margin: 50px 0;
                padding: 40px;
                background: #f8f9fa;
                border-radius: 10px;
              }
              .toc h2 {
                text-align: center;
                color: #2c3e50;
                margin-bottom: 30px;
              }
              .toc-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                font-size: 1.1em;
              }
              .toc-dots {
                flex: 1;
                margin: 0 10px;
                border-bottom: 2px dotted #ccc;
                height: 1em;
              }
              .chapter { 
                margin-bottom: 40px; 
                min-height: 100vh;
                position: relative;
              }
              .chapter h2 {
                color: #34495e;
                text-align: center;
                margin-bottom: 10px;
                font-size: 2.2em;
                font-weight: bold;
              }
              .chapter h3 {
                text-align: center;
                color: #34495e;
                margin-bottom: 30px;
                font-size: 1.8em;
                font-weight: normal;
              }
              img { 
                max-width: ${storyData.imageOrientation === 'landscape' ? '100%' : '70%'}; 
                height: auto; 
                margin: 30px auto; 
                display: block;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
              }
              .chapter-content {
                text-align: justify;
                font-size: 1.1em;
              }
              .page-number {
                text-align: center;
                color: #95a5a6;
                margin-top: 50px;
                font-size: 0.9em;
              }
            </style>
          </head>
          <body>
            <div class="chapter">
              <h1>${title}</h1>
              <p class="subtitle">A ${storyTypeName}</p>
              <div class="page-number">1</div>
            </div>
            
            <div class="toc">
              <h2>Table of Contents</h2>
              ${generatedChapters.map((chapter, index) => {
                const chapterMatch = chapter.match(/Chapter \d+: ([^\n]+)/);
                const chapterTitle = chapterMatch ? chapterMatch[1] : '';
                return `
                  <div class="toc-item">
                    <span>Chapter ${index + 1}: ${chapterTitle}</span>
                    <span class="toc-dots"></span>
                    <span>${index + 3}</span>
                  </div>
                `;
              }).join('')}
              <div class="page-number">2</div>
            </div>
            
            ${generatedChapters.map((chapter, index) => {
              const chapterMatch = chapter.match(/Chapter \d+: ([^\n]+)/);
              const chapterTitle = chapterMatch ? chapterMatch[1] : '';
              const chapterContent = chapter.replace(/Chapter \d+: [^\n]+\n/, '');
              
              return `
              <div class="chapter">
                <h2>Chapter ${index + 1}</h2>
                <h3>${chapterTitle}</h3>
                ${generatedImages[index] ? 
                  `<img src="${generatedImages[index]}" alt="Chapter ${index + 1} illustration" />` :
                  ''
                }
                <div class="chapter-content">${chapterContent.replace(/\n/g, '<br>')}</div>
                <div class="page-number">${index + 3}</div>
              </div>
            `;
            }).join('')}
          </body>
          </html>
        `;
        downloadFile(content, `${title}.html`, 'text/html');
        break;
        
      case 'txt':
        content = title + '\n' + '='.repeat(title.length) + '\n\n';
        content += 'Table of Contents\n\n';
        
        generatedChapters.forEach((chapter, index) => {
          const chapterMatch = chapter.match(/Chapter \d+: ([^\n]+)/);
          const chapterTitle = chapterMatch ? chapterMatch[1] : '';
          content += `Chapter ${index + 1}: ${chapterTitle}\n`;
        });
        
        content += '\n' + '-'.repeat(50) + '\n\n';
        content += generatedStory;
        
        downloadFile(content, `${title}.txt`, 'text/plain');
        break;
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">API Setup</h2>
            <p className="text-gray-600 mb-4">Enter your OpenAI API key to get started</p>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('openaiApiKey', e.target.value);
              }}
              className="w-full p-3 border rounded-lg"
            />
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Your API key is stored locally and never sent to any server except OpenAI.
                Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a>
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Choose Story Type</h2>
            <p className="text-gray-600 mb-4">What kind of story would you like to create?</p>
            <div className="grid gap-4">
              {storyTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setStoryData({ ...storyData, storyType: type.id })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      storyData.storyType === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Choose Your Story Genre</h2>
            <div className="grid grid-cols-2 gap-3">
              {(genresByType[storyData.storyType] || genresByType.general).map((genre) => (
                <button
                  key={genre}
                  onClick={() => setStoryData({ ...storyData, genre })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    storyData.genre === genre
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            {storyData.genre === 'Custom' && (
              <input
                type="text"
                placeholder="Enter your custom genre..."
                value={storyData.customGenre}
                onChange={(e) => setStoryData({ ...storyData, customGenre: e.target.value })}
                className="w-full p-3 border rounded-lg mt-3"
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Create Your Main Character</h2>
            <input
              type="text"
              placeholder={storyData.storyType === 'children' ? 
                "Character type (e.g., Curious child, Friendly animal)" : 
                "Character type (e.g., Kind teacher, Helpful neighbor)"}
              value={storyData.mainCharacter}
              onChange={(e) => setStoryData({ ...storyData, mainCharacter: e.target.value })}
              className="w-full p-3 border rounded-lg"
            />
            
            <div className="space-y-3 mt-4">
              <h3 className="font-semibold">Character Details (Optional)</h3>
              <input
                type="text"
                placeholder="Name"
                value={storyData.characterDetails.name}
                onChange={(e) => setStoryData({
                  ...storyData,
                  characterDetails: { ...storyData.characterDetails, name: e.target.value }
                })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Age"
                value={storyData.characterDetails.age}
                onChange={(e) => setStoryData({
                  ...storyData,
                  characterDetails: { ...storyData.characterDetails, age: e.target.value }
                })}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Ethnicity (e.g., African, Asian, European)"
                value={storyData.characterDetails.ethnicity}
                onChange={(e) => setStoryData({
                  ...storyData,
                  characterDetails: { ...storyData.characterDetails, ethnicity: e.target.value }
                })}
                className="w-full p-2 border rounded"
              />
              <textarea
                placeholder="Appearance (e.g., curly hair, wearing overalls)"
                value={storyData.characterDetails.appearance}
                onChange={(e) => setStoryData({
                  ...storyData,
                  characterDetails: { ...storyData.characterDetails, appearance: e.target.value }
                })}
                className="w-full p-2 border rounded h-20"
              />
              <textarea
                placeholder="Personality traits"
                value={storyData.characterDetails.personality}
                onChange={(e) => setStoryData({
                  ...storyData,
                  characterDetails: { ...storyData.characterDetails, personality: e.target.value }
                })}
                className="w-full p-2 border rounded h-20"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Select Your Setting</h2>
            <div className="grid grid-cols-2 gap-3">
              {(settingsByType[storyData.storyType] || settingsByType.general).map((setting) => (
                <button
                  key={setting}
                  onClick={() => setStoryData({ ...storyData, setting })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    storyData.setting === setting
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  {setting}
                </button>
              ))}
            </div>
            {storyData.setting === 'Custom' && (
              <input
                type="text"
                placeholder="Enter your custom setting..."
                value={storyData.customSetting}
                onChange={(e) => setStoryData({ ...storyData, customSetting: e.target.value })}
                className="w-full p-3 border rounded-lg mt-3"
              />
            )}
            <textarea
              placeholder="Describe the environment in detail (e.g., sunny playground with swings, cozy library with tall bookshelves)"
              value={storyData.environmentDetails}
              onChange={(e) => setStoryData({ ...storyData, environmentDetails: e.target.value })}
              className="w-full p-3 border rounded-lg h-24 mt-3"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Choose Plot Elements</h2>
            <p className="text-gray-600">Select elements you'd like in your story</p>
            <div className="space-y-2">
              {(plotElementsByType[storyData.storyType] || plotElementsByType.general).map((element) => (
                <label key={element} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={storyData.plotElements.includes(element)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setStoryData({
                          ...storyData,
                          plotElements: [...storyData.plotElements, element]
                        });
                      } else {
                        setStoryData({
                          ...storyData,
                          plotElements: storyData.plotElements.filter(el => el !== element)
                        });
                      }
                    }}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span>{element}</span>
                </label>
              ))}
            </div>
            <textarea
              placeholder="Add your own plot elements or story ideas..."
              value={storyData.customPlotElements}
              onChange={(e) => setStoryData({ ...storyData, customPlotElements: e.target.value })}
              className="w-full p-3 border rounded-lg h-20 mt-3"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Story Details</h2>
            
            <div>
              <label className="block font-semibold mb-2">Story Tone</label>
              <select
                value={storyData.tone}
                onChange={(e) => setStoryData({ ...storyData, tone: e.target.value })}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Select tone...</option>
                {(tonesByType[storyData.storyType] || tonesByType.general).map(tone => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Book Size</label>
              <div className="grid gap-3">
                {bookSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setStoryData({ ...storyData, bookSize: size.id })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      storyData.bookSize === size.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold">{size.name}</div>
                    <div className="text-sm text-gray-600">{size.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2">Number of Chapters</label>
              <input
                type="number"
                min="1"
                max="10"
                value={storyData.chapters}
                onChange={(e) => setStoryData({ ...storyData, chapters: parseInt(e.target.value) || 3 })}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Story Preview</h3>
              <p className="text-sm text-gray-600">
                A {storyData.tone} {storyData.genre === 'Custom' ? storyData.customGenre : storyData.genre} story 
                about {storyData.characterDetails.name || storyData.mainCharacter} in 
                {' '}{storyData.setting === 'Custom' ? storyData.customSetting : storyData.setting}.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Length:</strong> {storyData.chapters} chapters, approximately {storyData.totalWords} words total
              </p>
            </div>

            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={storyData.generateImages}
                  onChange={(e) => setStoryData({ ...storyData, generateImages: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <span className="font-semibold">Generate illustrations for each chapter</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Uses DALL-E 3 for high-quality illustrations (requires API access)
              </p>
              
              {storyData.generateImages && (
                <div className="ml-6 mt-3 space-y-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Image Orientation</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStoryData({ 
                          ...storyData, 
                          imageOrientation: 'square',
                          imageSize: '1024x1024'
                        })}
                        className={`px-4 py-2 rounded border ${
                          storyData.imageOrientation === 'square' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        Square (1:1)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoryData({ 
                          ...storyData, 
                          imageOrientation: 'landscape',
                          imageSize: '1792x1024'
                        })}
                        className={`px-4 py-2 rounded border ${
                          storyData.imageOrientation === 'landscape' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        Landscape (16:9)
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Image Style</label>
                    <select
                      value={storyData.imageStyle}
                      onChange={(e) => setStoryData({ ...storyData, imageStyle: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="colorful">Colorful Digital Art</option>
                      <option value="blackwhite">Black & White</option>
                      <option value="pencil">Pencil Drawing</option>
                      <option value="watercolor">Watercolor Painting</option>
                      <option value="cartoon">Cartoon Style</option>
                      <option value="realistic">Photorealistic</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-2">Image Quality</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStoryData({ ...storyData, imageQuality: 'standard' })}
                        className={`px-4 py-2 rounded border ${
                          storyData.imageQuality === 'standard' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setStoryData({ ...storyData, imageQuality: 'hd' })}
                        className={`px-4 py-2 rounded border ${
                          storyData.imageQuality === 'hd' 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        HD (Higher cost)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <label className="block font-semibold mb-2">PDF Page Size</label>
              <select
                value={storyData.pdfPageSize}
                onChange={(e) => setStoryData({ ...storyData, pdfPageSize: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="letter">Letter (8.5" × 11")</option>
                <option value="a4">A4 (210mm × 297mm)</option>
                <option value="a5">A5 (148mm × 210mm)</option>
              </select>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Generate Your Story</h2>
            
            {!storyData.generatedStory ? (
              <div className="text-center py-8">
                <Sun className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                <p className="text-gray-600 mb-6">Ready to create your {storyData.storyType === 'children' ? 'children\'s' : storyData.storyType === 'moral' ? 'wholesome' : ''} story?</p>
                {generationProgress && (
                  <p className="text-purple-600 mb-4 font-semibold">{generationProgress}</p>
                )}
                <button
                  onClick={generateStoryInChunks}
                  disabled={isGenerating || !apiKey}
                  className="bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold disabled:bg-gray-300 hover:bg-purple-600 transition-colors"
                >
                  {isGenerating ? 'Creating Your Story...' : 'Generate Story'}
                </button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Your Story</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={saveStory}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
                
                <div className="prose max-w-none bg-white p-6 rounded-lg border">
                  {storyData.generatedChapters.map((chapter, index) => (
                    <div key={index} className="mb-8">
                      {storyData.generatedImages[index] && (
                        <img 
                          src={storyData.generatedImages[index]} 
                          alt={`Chapter ${index + 1} illustration`}
                          className="w-full max-w-md mx-auto my-4 rounded-lg shadow-md"
                        />
                      )}
                      <div className="whitespace-pre-wrap">{chapter}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadStory('html')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    <Globe className="w-4 h-4" />
                    Download HTML
                  </button>
                  <button
                    onClick={() => downloadStory('pdf')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <FileText className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => downloadStory('txt')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    <FileCode className="w-4 h-4" />
                    Download TXT
                  </button>
                  {storyData.generatedImages.some(img => img) && (
                    <button
                      onClick={() => {
                        // Download all images as a zip or individually
                        storyData.generatedImages.forEach((img, index) => {
                          if (img) {
                            const link = document.createElement('a');
                            link.href = img;
                            link.download = `chapter-${index + 1}-illustration.png`;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      <Image className="w-4 h-4" />
                      Download Images
                    </button>
                  )}
                </div>
                
                {storyData.generatedImages.some(img => img) && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Due to browser security restrictions, images may not embed in the PDF. 
                      Use the HTML download for best results, or download images separately and add them to the PDF manually.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setStoryData({
                      storyType: '',
                      genre: '',
                      customGenre: '',
                      mainCharacter: '',
                      characterDetails: {
                        name: '',
                        age: '',
                        ethnicity: '',
                        appearance: '',
                        personality: ''
                      },
                      setting: '',
                      customSetting: '',
                      environmentDetails: '',
                      plotElements: [],
                      customPlotElements: '',
                      tone: '',
                      bookSize: 'short',
                      chapters: 3,
                      wordsPerChapter: 500,
                      totalWords: 1500,
                      generateImages: true,
                      imageOrientation: 'square',
                      imageSize: '1024x1024',
                      imageStyle: 'colorful',
                      imageQuality: 'standard',
                      pdfPageSize: 'letter',
                      generatedStory: null,
                      generatedImages: [],
                      generatedChapters: [],
                      chapterSummaries: []
                    });
                    setCurrentStep(1);
                    setGenerationProgress('');
                  }}
                  className="mt-4 w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Create Another Story
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-purple-800 flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              Story Creator
            </h1>
            <button
              onClick={() => setShowSavedStories(!showSavedStories)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              <BookOpen className="w-4 h-4" />
              Saved Stories ({savedStories.length})
            </button>
          </div>

          {showSavedStories ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold mb-4">Your Saved Stories</h2>
              {savedStories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No saved stories yet</p>
              ) : (
                <div className="grid gap-3">
                  {savedStories.map((story) => (
                    <div key={story.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                         onClick={() => loadStory(story)}>
                      <h3 className="font-semibold">{story.title}</h3>
                      <p className="text-sm text-gray-500">Created on {story.date}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowSavedStories(false)}
                className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Back to Story Creation
              </button>
            </div>
          ) : (
            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-between mb-8 overflow-x-auto">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      index <= currentStep ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-1 w-8 mx-1 ${
                        index < currentStep ? 'bg-purple-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              <div className="mb-8">
                {renderStep()}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                {currentStep < steps.length - 1 && (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 0 && !apiKey) ||
                      (currentStep === 1 && !storyData.storyType) ||
                      (currentStep === 2 && !storyData.genre) ||
                      (currentStep === 3 && !storyData.mainCharacter) ||
                      (currentStep === 4 && !storyData.setting) ||
                      (currentStep === 6 && !storyData.tone)
                    }
                    className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50 hover:bg-purple-600"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryWizardApp;